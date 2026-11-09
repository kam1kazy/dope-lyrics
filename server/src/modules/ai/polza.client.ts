import { z } from 'zod';

import { env } from '~/config/env';

export class AiProviderError extends Error {}

export type AiCompletionParams = {
  system: string;
  user: string;
  maxTokens: number;
};

export type AiCompletionResult = {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
};

const responseSchema = z.object({
  model: z.string().optional(),
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().nullable().optional() }),
      })
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number().optional(),
      completion_tokens: z.number().optional(),
    })
    .optional(),
});

export const isAiConfigured = (): boolean =>
  Boolean(env.AI_API_KEY && env.AI_BASE_URL && env.AI_MODEL);

export const completeWithModel = async (
  params: AiCompletionParams
): Promise<AiCompletionResult> => {
  if (!isAiConfigured()) {
    throw new AiProviderError('ИИ не настроен');
  }

  let response: Response;

  try {
    response = await fetch(
      `${env.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.AI_MODEL,
          max_tokens: params.maxTokens,
          messages: [
            { role: 'system', content: params.system },
            { role: 'user', content: params.user },
          ],
        }),
        signal: AbortSignal.timeout(env.AI_TIMEOUT_MS),
      }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new AiProviderError('ИИ не ответил вовремя, попробуйте ещё раз');
    }

    throw new AiProviderError('Не удалось связаться с ИИ');
  }

  if (!response.ok) {
    throw new AiProviderError(`ИИ вернул ошибку ${response.status}`);
  }

  const parsed = responseSchema.safeParse(await response.json());

  if (!parsed.success) {
    throw new AiProviderError('ИИ вернул ответ в неожиданном формате');
  }

  const text = parsed.data.choices[0]?.message.content?.trim() ?? '';

  if (!text) {
    throw new AiProviderError('ИИ вернул пустой ответ');
  }

  return {
    text,
    tokensIn: parsed.data.usage?.prompt_tokens ?? 0,
    tokensOut: parsed.data.usage?.completion_tokens ?? 0,
    model: parsed.data.model ?? env.AI_MODEL,
  };
};
