import { GraphQLError } from 'graphql';

import { env } from '~/config/env';
import { prisma } from '~/infrastructure/prisma';
import { getCurrentPrompt } from '~/modules/ai/ai-prompt.service';
import { rankArtistCandidates } from '~/modules/ai/artist-orientation';
import {
  buildRewriteSystem,
  buildRewriteUser,
  collectRewriteSections,
  FRAME_VERSION,
  sectionsToText,
  stripModelWrapper,
} from '~/modules/ai/collage-rewrite';
import { callModel } from '~/modules/ai/model-call';
import { AiProviderError, isAiConfigured } from '~/modules/ai/polza.client';
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
    sourceText: sectionsToText(sections),
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

const parseRewrite = (text: string): string => {
  const aiText = stripModelWrapper(text);

  if (!aiText) {
    throw new AiProviderError('ИИ вернул пустой ответ');
  }

  return aiText;
};

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
  const { value: aiText, usageId } = await callModel(
    {
      userId,
      kind: 'COLLAGE_REWRITE',
      frameVersion: FRAME_VERSION,
      promptId: prompt?.id ?? null,
      system: buildRewriteSystem(),
      user: buildRewriteUser({
        theme,
        authorPrompt: prompt?.text ?? '',
        sections: sections.map((section) => ({
          label: section.label,
          text: section.text,
          ...rankArtistCandidates(facetsForSection(section, rowsById)),
        })),
      }),
      maxTokens: env.AI_MAX_TOKENS,
    },
    parseRewrite
  );

  return { sourceText, aiText, usageId };
};
