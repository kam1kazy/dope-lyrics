import { env } from '~/config/env';
import { callModel } from '~/modules/ai/model/model-call';
import {
  AiProviderError,
  isAiConfigured,
} from '~/modules/ai/model/polza.client';
import { LyricsSourceError } from '~/modules/references/import-error';

export const LYRICS_WEB_SEARCH_VERSION = '1.0.0';

const NOT_FOUND = 'НЕ НАЙДЕН';

const LYRICS_WEB_SYSTEM = [
  'Ты достаёшь текст песни из результатов веб-поиска (как в выдаче Google).',
  'Верни только текст песни: куплеты и припев, оригинальный язык, без перевода.',
  'Без заголовков, без [Припев]/[Куплет], без ссылок и источников, без markdown.',
  'Не придумывай строки: только то, что есть в поиске.',
  `Если полного текста нет — ответь ровно: ${NOT_FOUND}`,
].join('\n');

const cleanLyricsBody = (raw: string): string =>
  raw
    .replace(/^```(?:text)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

export const parseLyricsWebReply = (raw: string): string => {
  const text = cleanLyricsBody(raw);

  if (!text || text.toUpperCase() === NOT_FOUND) {
    throw new AiProviderError(NOT_FOUND);
  }

  if (text.length < 40) {
    throw new AiProviderError('Слишком короткий ответ');
  }

  return text;
};

/** Как запрос «платина блад с волк текст» в Google — через polza web. */
export const fetchTrackLyricsFromWebSearch = async (
  userId: number,
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string }> => {
  if (!isAiConfigured()) {
    throw new LyricsSourceError('Поиск текстов: ИИ не настроен');
  }

  const query = `${artistName} ${trackTitle} текст`;

  try {
    const { value } = await callModel(
      {
        userId,
        kind: 'REFERENCE_SELECT',
        frameVersion: LYRICS_WEB_SEARCH_VERSION,
        promptId: null,
        system: LYRICS_WEB_SYSTEM,
        user: `Исполнитель: ${artistName}\nТрек: «${trackTitle}»`,
        maxTokens: Math.min(env.AI_MAX_TOKENS, 8192),
        webSearch: { query },
      },
      parseLyricsWebReply
    );

    return { title: trackTitle, text: value };
  } catch (error: unknown) {
    if (error instanceof AiProviderError) {
      throw new LyricsSourceError(`Поиск: ${error.message}`);
    }

    throw error;
  }
};
