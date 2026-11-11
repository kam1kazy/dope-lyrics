import { GraphQLError } from 'graphql';

import { env } from '~/config/env';
import { prisma } from '~/infrastructure/prisma';
import { getCurrentPrompt } from '~/modules/ai/ai-prompt.service';
import { recordUsage } from '~/modules/ai/ai-usage.service';
import { rankArtistCandidates } from '~/modules/ai/artist-orientation';
import {
  buildRewriteSystem,
  buildRewriteUser,
  collectRewriteSections,
  FRAME_VERSION,
  pickStyleExamples,
  stripModelWrapper,
} from '~/modules/ai/collage-rewrite';
import {
  AiProviderError,
  completeWithModel,
  isAiConfigured,
} from '~/modules/ai/polza.client';
import {
  isLyricDelivery,
  isLyricEnergy,
  isLyricMood,
  roleProfilesFromJson,
} from '~/modules/lyrics/lyric-facets';
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
    select: {
      id: true,
      mood: true,
      delivery: true,
      energy: true,
      roleProfiles: true,
      message: { select: { text: true } },
    },
  });
  const textsById = new Map(
    rows.map((row) => [row.id, row.message?.text ?? ''])
  );
  const sections = collectRewriteSections(slots, textsById, hideAdlibs);

  return {
    slots,
    lyricIds,
    sections,
    rows,
    sourceText: sections
      .map((section) => `[${section.label}]\n${section.text}`)
      .join('\n\n'),
  };
};

const facetsForSection = (
  section: { songRole: string; lyricIds: number[] },
  rows: ReadonlyMap<
    number,
    {
      mood: string[];
      delivery: string[];
      energy: string | null;
      roleProfiles: unknown;
    }
  >
): {
  moods: string[];
  energies: string[];
  deliveries: string[];
} => {
  const moods = new Set<string>();
  const energies = new Set<string>();
  const deliveries = new Set<string>();

  for (const lyricId of section.lyricIds) {
    const row = rows.get(lyricId);
    if (!row) {
      continue;
    }

    const profile = roleProfilesFromJson(row.roleProfiles).find(
      (item) => item.songRole === section.songRole
    );
    const mood =
      profile && profile.mood.length > 0
        ? profile.mood
        : row.mood.filter(isLyricMood);
    const delivery =
      profile && profile.delivery.length > 0
        ? profile.delivery
        : row.delivery.filter(isLyricDelivery);

    for (const item of mood) {
      moods.add(item);
    }
    for (const item of delivery) {
      deliveries.add(item);
    }
    if (row.energy && isLyricEnergy(row.energy)) {
      energies.add(row.energy);
    }
  }

  return {
    moods: [...moods],
    energies: [...energies],
    deliveries: [...deliveries],
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

const providerMessage = (error: unknown): string =>
  error instanceof AiProviderError
    ? error.message
    : 'Не удалось получить ответ ИИ';

export const rewriteCollage = async (
  userId: number,
  input: RewriteCollageInput
) => {
  if (!isAiConfigured()) {
    throw new GraphQLError('ИИ не настроен');
  }

  const { sourceText, sections, rows } = await sourceTextFromSlots(
    userId,
    input.slots,
    input.hideAdlibs === true
  );

  if (!sourceText) {
    throw new GraphQLError('В склейке нет строк');
  }

  const theme = input.theme?.trim() || null;
  const prompt = await getCurrentPrompt(userId);
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const startedAt = Date.now();

  try {
    const result = await completeWithModel({
      system: buildRewriteSystem(),
      user: buildRewriteUser({
        theme,
        authorPrompt: prompt?.text ?? '',
        examples: [],
        sections: sections.map((section) => ({
          label: section.label,
          text: section.text,
          ...rankArtistCandidates(facetsForSection(section, rowsById)),
        })),
      }),
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
    const message = providerMessage(error);

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
