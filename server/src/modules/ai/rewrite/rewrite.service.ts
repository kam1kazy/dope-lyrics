import { GraphQLError } from 'graphql';

import { env } from '~/config/env';
import { prisma } from '~/infrastructure/prisma';
import {
  loadArtistPool,
  type ReferenceFilter,
} from '~/modules/ai/artists/load';
import {
  assignReferenceTexts,
  facetsForSection,
  rankArtistCandidates,
} from '~/modules/ai/artists/pick';
import {
  HOOK_PICKED_KINDS,
  PICKED_KINDS,
} from '~/modules/ai/artists/techniques';
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
  references?: ReferenceFilter | null;
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

export type RewritePrompt = { id: number | null; text: string };

/** Запрос «Поправить ИИ» без вызова модели. Промпт можно подменить — для прогонов вне приложения. */
export const buildRewriteRequest = async (
  userId: number,
  input: RewriteCollageInput,
  promptOverride?: RewritePrompt
) => {
  const [{ sourceText, sections, rows }, stored, pool] = await Promise.all([
    sourceTextFromSlots(userId, input.slots, input.hideAdlibs === true),
    promptOverride ? null : getCurrentPrompt(userId),
    loadArtistPool(userId, input.references),
  ]);

  if (!sourceText) {
    throw new GraphQLError('В склейке нет строк');
  }

  const prompt: RewritePrompt = promptOverride ?? {
    id: stored?.id ?? null,
    text: stored?.text ?? '',
  };
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const picked = sections.map((section) => {
    const facets = facetsForSection(section, rowsById);

    return {
      section,
      facets,
      ...rankArtistCandidates(
        pool,
        facets,
        section.songRole === 'HOOK' ? HOOK_PICKED_KINDS : PICKED_KINDS
      ),
    };
  });
  const { references, bySection } = assignReferenceTexts(
    picked.map((item) => ({
      songRole: item.section.songRole,
      facets: item.facets,
      artists: item.artists,
    }))
  );

  return {
    sourceText,
    promptId: prompt.id,
    system: buildRewriteSystem(),
    user: buildRewriteUser({
      theme: input.theme?.trim() || null,
      authorPrompt: prompt.text,
      sections: picked.map((item, index) => ({
        label: item.section.label,
        text: item.section.text,
        artists: item.artists,
        relaxed: item.relaxed,
        referenceNumbers: bySection[index],
      })),
      references,
    }),
  };
};

export const rewriteCollageRequest = (
  userId: number,
  request: Awaited<ReturnType<typeof buildRewriteRequest>>
) =>
  callModel(
    {
      userId,
      kind: 'COLLAGE_REWRITE',
      frameVersion: FRAME_VERSION,
      promptId: request.promptId,
      system: request.system,
      user: request.user,
      maxTokens: env.AI_MAX_TOKENS,
    },
    parseRewrite
  );

export const rewriteCollage = async (
  userId: number,
  input: RewriteCollageInput
) => {
  if (!isAiConfigured()) {
    throw new GraphQLError('ИИ не настроен');
  }

  const request = await buildRewriteRequest(userId, input);
  const { value: aiText, usageId } = await rewriteCollageRequest(
    userId,
    request
  );

  return { sourceText: request.sourceText, aiText, usageId };
};
