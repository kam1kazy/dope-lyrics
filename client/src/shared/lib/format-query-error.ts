import {
  CombinedGraphQLErrors,
  ServerError,
  ServerParseError,
} from '@apollo/client/errors';

const FALLBACK = 'Ошибка загрузки данных';
const MAX_LENGTH = 160;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function firstString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function messageFromPayload(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const keyed = firstString(value.error);
  if (keyed) {
    return keyed;
  }

  if (Array.isArray(value.errors)) {
    for (const item of value.errors) {
      if (!isRecord(item)) {
        continue;
      }

      const message = firstString(item.message);
      if (message) {
        return message;
      }
    }
  }

  return firstString(value.message);
}

function messageFromBodyText(bodyText: string): string | null {
  const trimmed = bodyText.trim();
  if (trimmed === '' || trimmed.startsWith('<')) {
    return null;
  }

  try {
    return messageFromPayload(JSON.parse(trimmed));
  } catch {
    return null;
  }
}

function translateGraphqlNoise(message: string): string {
  const firstLine = message.split('\n')[0]?.trim() ?? message;
  const withoutHint = firstLine.replace(/\s*Did you mean\b.*/i, '').trim();

  const unknownType = withoutHint.match(/^Unknown type "([^"]+)"/i);
  if (unknownType) {
    return `Неизвестный тип «${unknownType[1]}»`;
  }

  const unknownArgument = withoutHint.match(/^Unknown argument "([^"]+)"/i);
  if (unknownArgument) {
    return `Неизвестный аргумент «${unknownArgument[1]}»`;
  }

  const unknownField = withoutHint.match(/^Cannot query field "([^"]+)"/i);
  if (unknownField) {
    return `Нет поля «${unknownField[1]}»`;
  }

  const invalidVariable = withoutHint.match(
    /^Variable "\$([^"]+)" got invalid value/i
  );
  if (invalidVariable) {
    return `Некорректное значение для «${invalidVariable[1]}»`;
  }

  if (/csrf prevention enabled/i.test(message)) {
    return 'Запрос отклонён сервером';
  }

  if (/^unexpected error\.?$/i.test(withoutHint)) {
    return 'Неожиданная ошибка сервера';
  }

  return withoutHint;
}

function isGenericNetworkMessage(message: string): boolean {
  return /failed to fetch|load failed|networkerror|network request failed|response not successful|received status code/i.test(
    message
  );
}

function clip(message: string): string {
  if (message.length <= MAX_LENGTH) {
    return message;
  }

  return `${message.slice(0, MAX_LENGTH - 1).trimEnd()}…`;
}

export function formatQueryError(error: unknown): string {
  if (CombinedGraphQLErrors.is(error)) {
    const message = error.errors
      .map((item) => firstString(item.message))
      .find((item) => item !== null);
    if (message) {
      return clip(translateGraphqlNoise(message));
    }
  }

  if (ServerError.is(error) || ServerParseError.is(error)) {
    const fromBody = messageFromBodyText(error.bodyText);
    if (fromBody) {
      return clip(translateGraphqlNoise(fromBody));
    }
  }

  if (error instanceof Error) {
    const fromCause = formatQueryError(error.cause);
    if (fromCause !== FALLBACK) {
      return fromCause;
    }

    if (!isGenericNetworkMessage(error.message)) {
      const translated = translateGraphqlNoise(error.message);
      if (translated !== '' && !isGenericNetworkMessage(translated)) {
        return clip(translated);
      }
    }

    return 'Нет связи с сервером';
  }

  const fromUnknown = messageFromPayload(error);
  if (fromUnknown) {
    return clip(translateGraphqlNoise(fromUnknown));
  }

  return FALLBACK;
}
