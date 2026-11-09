import { GraphQLError } from 'graphql';
import { z } from 'zod';

import { env } from '~/config/env';

import { recordUsage } from './ai-usage.service';
import {
  AiProviderError,
  completeWithModel,
  isAiConfigured,
} from './polza.client';

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

  const startedAt = Date.now();
  let model = env.AI_MODEL;
  let tokensIn = 0;
  let tokensOut = 0;

  try {
    const result = await completeWithModel({
      system: PROMPT_META_SYSTEM,
      user: text,
      maxTokens: 300,
    });

    model = result.model;
    tokensIn = result.tokensIn;
    tokensOut = result.tokensOut;

    const meta = parsePromptMeta(result.text);

    await recordUsage({
      userId,
      kind: 'PROMPT_META',
      model,
      frameVersion: PROMPT_META_FRAME_VERSION,
      promptId: null,
      tokensIn,
      tokensOut,
      latencyMs: Date.now() - startedAt,
      status: 'OK',
    });

    return meta;
  } catch (error: unknown) {
    const message =
      error instanceof AiProviderError
        ? error.message
        : 'Не удалось получить ответ ИИ';

    await recordUsage({
      userId,
      kind: 'PROMPT_META',
      model,
      frameVersion: PROMPT_META_FRAME_VERSION,
      promptId: null,
      tokensIn,
      tokensOut,
      latencyMs: Date.now() - startedAt,
      status: 'ERROR',
      error: message,
    });

    throw new GraphQLError(message);
  }
};
