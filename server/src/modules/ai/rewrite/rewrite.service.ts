import { GraphQLError } from 'graphql';

import { env } from '~/config/env';
import { prisma } from '~/infrastructure/prisma';
import {
  facetsForSection,
  rankArtistCandidates,
} from '~/modules/ai/artists/pick';
import { callModel } from '~/modules/ai/model/model-call';
import {
  AiProviderError,
  isAiConfigured,
} from '~/modules/ai/model/polza.client';
import { getCurrentPrompt } from '~/modules/ai/prompt/ai-prompt.service';
import { buildRewriteSystem, FRAME_VERSION } from '~/modules/ai/rewrite/frame';
import {
  buildRewriteUser,
  collectRewriteSections,
  sectionsToText,
  stripModelWrapper,
} from '~/modules/ai/rewrite/request';
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
