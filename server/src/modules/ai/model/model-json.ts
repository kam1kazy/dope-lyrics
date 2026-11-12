import { AiProviderError } from '~/modules/ai/model/polza.client';

/** JSON из ответа модели: срезает блок кода и текст вокруг объекта. */
export const parseModelJson = (raw: string, message: string): unknown => {
  const unwrapped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const start = unwrapped.indexOf('{');
  const end = unwrapped.lastIndexOf('}');

  if (start === -1 || end <= start) {
    throw new AiProviderError(message);
  }

  try {
    return JSON.parse(unwrapped.slice(start, end + 1));
  } catch {
    throw new AiProviderError(message);
  }
};
