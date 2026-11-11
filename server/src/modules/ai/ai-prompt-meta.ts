import { GraphQLError } from 'graphql';
import { z } from 'zod';

import { callModel } from './model-call';
import { AiProviderError, isAiConfigured } from './polza.client';

export const PROMPT_META_FRAME_VERSION = 1;

const PROMPT_META_SYSTEM = [
  'Ты придумываешь название и описание для промпта, которым автор управляет ИИ-редактором своих текстов.',
  'Верни только JSON: {"name": "...", "description": "..."}.',
  'name — до 40 символов, ёмко и понятно, по сути промпта.',
  'description — одно предложение: чем эта версия отличается и как пишет модель.',
  'Тон живой, местами можно пошутить, но смысл должен быть ясен с первого взгляда.',
  'Язык — русский. Без кавычек вокруг JSON, без пояснений.',
].join('\n');

const metaSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300),
});

export const parsePromptMeta = (raw: string) => {
  const unwrapped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  let json: unknown;

  try {
    json = JSON.parse(unwrapped);
  } catch {
    throw new AiProviderError('ИИ вернул название в неожиданном формате');
  }

  const parsed = metaSchema.safeParse(json);

  if (!parsed.success) {
    throw new AiProviderError('ИИ вернул название в неожиданном формате');
  }

  return parsed.data;
};

export const suggestPromptMeta = async (userId: number, text: string) => {
  if (!isAiConfigured()) {
    throw new GraphQLError('ИИ не настроен');
  }

  if (!text.trim()) {
    throw new GraphQLError('Сначала напишите текст промпта');
  }

  const { value } = await callModel(
    {
      userId,
      kind: 'PROMPT_META',
      frameVersion: PROMPT_META_FRAME_VERSION,
      promptId: null,
      system: PROMPT_META_SYSTEM,
      user: text,
      maxTokens: 300,
    },
    parsePromptMeta
  );

  return value;
};
