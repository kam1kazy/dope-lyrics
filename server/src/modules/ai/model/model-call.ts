import { GraphQLError } from 'graphql';

import { env } from '~/config/env';
import type { AiUsageKind } from '~/generated/prisma/client';
import { recordUsage } from '~/modules/ai/model/ai-usage.service';
import {
  type AiCompletionResult,
  AiProviderError,
  completeWithModel,
} from '~/modules/ai/model/polza.client';

export type ModelCallInput = {
  userId: number;
  kind: AiUsageKind;
  frameVersion: string;
  promptId: number | null;
  system: string;
  user: string;
  maxTokens: number;
  webSearch?: { query: string };
};

/**
 * Вызов модели с записью в AiUsage на успех и на ошибку.
 * Если модель ответила, а `parse` бросил, потраченные токены всё равно учитываются.
 * Ошибка самой записи OK не маскируется под ошибку модели: уходит как есть.
 */
export const callModel = async <T>(
  input: ModelCallInput,
  parse: (text: string) => T
): Promise<{ value: T; usageId: number }> => {
  const startedAt = Date.now();
  let completion: AiCompletionResult | null = null;
  let value: T;

  const usage = {
    userId: input.userId,
    kind: input.kind,
    frameVersion: input.frameVersion,
    promptId: input.promptId,
  };

  try {
    completion = await completeWithModel({
      system: input.system,
      user: input.user,
      maxTokens: input.maxTokens,
      webSearch: input.webSearch,
    });

    if (completion.truncated) {
      throw new AiProviderError(
        'ИИ оборвал ответ на лимите токенов, попробуйте ещё раз'
      );
    }

    value = parse(completion.text);
  } catch (error: unknown) {
    const expected =
      error instanceof AiProviderError || error instanceof GraphQLError;

    if (!expected) {
      console.error(`[ai:${input.kind}]`, error);
    }

    const message = expected ? error.message : 'Не удалось получить ответ ИИ';

    await recordUsage({
      ...usage,
      model: completion?.model ?? env.AI_MODEL,
      tokensIn: completion?.tokensIn ?? 0,
      tokensOut: completion?.tokensOut ?? 0,
      searchCostRub: completion?.searchCostRub ?? 0,
      latencyMs: Date.now() - startedAt,
      status: 'ERROR',
      error: message,
    });

    throw new GraphQLError(message);
  }

  const row = await recordUsage({
    ...usage,
    model: completion.model,
    tokensIn: completion.tokensIn,
    tokensOut: completion.tokensOut,
    searchCostRub: completion.searchCostRub,
    latencyMs: Date.now() - startedAt,
    status: 'OK',
  });

  return { value, usageId: row.id };
};
