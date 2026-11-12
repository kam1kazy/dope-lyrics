import { GraphQLError } from 'graphql';
import { z } from 'zod';

import { callModel } from '~/modules/ai/model/model-call';
import { parseModelJson } from '~/modules/ai/model/model-json';
import {
  AiProviderError,
  isAiConfigured,
} from '~/modules/ai/model/polza.client';

export const PROMPT_META_FRAME_VERSION = '0.1.0';

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

const FORMAT_ERROR = 'ИИ вернул название в неожиданном формате';

export const parsePromptMeta = (raw: string) => {
  const parsed = metaSchema.safeParse(parseModelJson(raw, FORMAT_ERROR));

  if (!parsed.success) {
    throw new AiProviderError(FORMAT_ERROR);
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
