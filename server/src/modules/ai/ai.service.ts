import { GraphQLError } from 'graphql';

import { env } from '~/config/env';
import { prisma } from '~/infrastructure/prisma';
import { getCurrentPrompt } from '~/modules/ai/ai-prompt.service';
import { recordUsage } from '~/modules/ai/ai-usage.service';
import {
  buildRewriteSystem,
  buildRewriteUser,
  buildSourceText,
  FRAME_VERSION,
  pickStyleExamples,
  stripModelWrapper,
} from '~/modules/ai/collage-rewrite';
import {
  AiProviderError,
  completeWithModel,
  isAiConfigured,
} from '~/modules/ai/polza.client';
import { type LyricsListOptions } from '~/modules/lyrics/lyrics-list-filters';
import {
  lyricIdsFromSlots,
  parseCollageSlotsInput,
} from '~/modules/lyrics/track-assemble';

export type RewriteFilter = Pick<
  LyricsListOptions,
  | 'tags'
  | 'keyword'
  | 'emojis'
  | 'dateFrom'
  | 'dateTo'
  | 'includeShelves'
  | 'excludeShelves'
  | 'mood'
  | 'excludeMood'
  | 'delivery'
  | 'excludeDelivery'
  | 'songRole'
  | 'excludeSongRole'
  | 'readiness'
  | 'excludeReadiness'
  | 'energy'
  | 'excludeEnergy'
  | 'sources'
>;

export type RewriteCollageInput = {
  slots: unknown;
  theme?: string | null;
  filter?: RewriteFilter | null;
  hideAdlibs?: boolean | null;
};

export const sourceTextFromSlots = async (
  userId: number,
  slotsInput: unknown,
  hideAdlibs: boolean
) => {
  const slots = parseCollageSlotsInput(slotsInput);
  const lyricIds = lyricIdsFromSlots(slots);
  const rows = await prisma.lyrics.findMany({
    where: { id: { in: lyricIds }, userId },
    select: { id: true, message: { select: { text: true } } },
  });
  const textsById = new Map(
    rows.map((row) => [row.id, row.message?.text ?? ''])
  );

  return {
    slots,
    lyricIds,
    sourceText: buildSourceText(slots, textsById, hideAdlibs),
  };
};

export const loadStyleExamples = async (
  userId: number,
  excludeIds: number[]
): Promise<string[]> => {
  const references = await prisma.lyrics.findMany({
    where: {
      userId,
      isReference: true,
      isHidden: false,
      isCensored: false,
      id: { notIn: excludeIds },
    },
    orderBy: { date: 'desc' },
    take: env.AI_STYLE_EXAMPLES,
    select: { message: { select: { text: true } } },
  });

  return pickStyleExamples(
    references.map((row) => row.message?.text ?? ''),
    env.AI_STYLE_EXAMPLES
  );
};

export const rewriteCollage = async (
  userId: number,
  input: RewriteCollageInput
) => {
  if (!isAiConfigured()) {
    throw new GraphQLError('ИИ не настроен');
  }

  const { sourceText } = await sourceTextFromSlots(
    userId,
    input.slots,
    input.hideAdlibs === true
  );

  if (!sourceText) {
    throw new GraphQLError('В склейке нет строк');
  }

  const theme = input.theme?.trim() || null;
  const prompt = await getCurrentPrompt(userId);
  const startedAt = Date.now();

  try {
    const result = await completeWithModel({
      system: buildRewriteSystem(prompt?.text ?? ''),
      user: buildRewriteUser({ theme, examples: [], sourceText }),
      maxTokens: env.AI_MAX_TOKENS,
    });
    const aiText = stripModelWrapper(result.text);

    if (!aiText) {
      throw new AiProviderError('ИИ вернул пустой ответ');
    }

    const usage = await recordUsage({
      userId,
      kind: 'COLLAGE_REWRITE',
      model: result.model,
      frameVersion: FRAME_VERSION,
      promptId: prompt?.id ?? null,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      latencyMs: Date.now() - startedAt,
      status: 'OK',
    });

    return { sourceText, aiText, usageId: usage.id };
  } catch (error: unknown) {
    const message =
      error instanceof AiProviderError
        ? error.message
        : 'Не удалось получить ответ ИИ';

    await recordUsage({
      userId,
      kind: 'COLLAGE_REWRITE',
      model: env.AI_MODEL,
      frameVersion: FRAME_VERSION,
      promptId: prompt?.id ?? null,
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: Date.now() - startedAt,
      status: 'ERROR',
      error: message,
    });

    throw new GraphQLError(message);
  }
};
