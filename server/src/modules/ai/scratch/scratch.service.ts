import { GraphQLError } from 'graphql';

import { env } from '~/config/env';
import {
  isReferenceFilterActive,
  loadArtistPool,
  type ReferenceFilter,
} from '~/modules/ai/artists/load';
import type { SectionFacets } from '~/modules/ai/artists/pick';
import type { ArtistProfile } from '~/modules/ai/artists/profiles';
import { callModel } from '~/modules/ai/model/model-call';
import {
  AiProviderError,
  isAiConfigured,
} from '~/modules/ai/model/polza.client';
import { getCurrentPrompt } from '~/modules/ai/prompt/ai-prompt.service';
import { keepKnown } from '~/modules/ai/references/vocabulary';
import { stripModelWrapper } from '~/modules/ai/rewrite/request';
import type { RewritePrompt } from '~/modules/ai/rewrite/rewrite.service';
import { findCloseLines } from '~/modules/ai/scratch/close';
import {
  buildScratchSystem,
  SCRATCH_FRAME_VERSION,
} from '~/modules/ai/scratch/frame';
import { pickScratchCollage } from '~/modules/ai/scratch/pick';
import {
  buildScratchUser,
  collageChunks,
  collageSources,
  collageText,
} from '~/modules/ai/scratch/request';
import {
  isLyricDelivery,
  isLyricEnergy,
  isLyricMood,
} from '~/modules/lyrics/lyric-facets';
import { parseTrackFormQuotas } from '~/modules/lyrics/track-assemble';

export type ScratchFacetsInput = {
  moods?: readonly string[] | null;
  deliveries?: readonly string[] | null;
  energies?: readonly string[] | null;
};

export type ScratchInput = {
  theme: string;
  form: unknown;
  facets?: ScratchFacetsInput | null;
  references?: ReferenceFilter | null;
};

export type ScratchOptions = {
  /** Промпт вместо текущего из «Настроек ИИ» — для прогонов. */
  prompt?: RewritePrompt;
  random?: () => number;
};

export const requireScratchTheme = (theme: string): string => {
  const trimmed = theme.trim();
  if (!trimmed) {
    throw new GraphQLError('Тема не может быть пустой');
  }

  return trimmed;
};

const parseFacets = (input: ScratchFacetsInput | null | undefined) =>
  ({
    moods: keepKnown(input?.moods ?? undefined, isLyricMood),
    deliveries: keepKnown(input?.deliveries ?? undefined, isLyricDelivery),
    energies: keepKnown(input?.energies ?? undefined, isLyricEnergy),
  }) satisfies SectionFacets;

/** Склейка из полки и запрос «С нуля», без базы и модели. */
export const assembleScratchRequest = (
  input: ScratchInput,
  pool: readonly ArtistProfile[],
  prompt: RewritePrompt,
  options: Pick<ScratchOptions, 'random'> = {}
) => {
  const theme = requireScratchTheme(input.theme);
  const quotas = parseTrackFormQuotas(input.form);
  if (Object.values(quotas).every((count) => count === 0)) {
    throw new GraphQLError('В форме трека нет частей');
  }

  const parts = pickScratchCollage(pool, {
    facets: parseFacets(input.facets),
    theme,
    quotas,
    chosenTextIds: input.references?.textIds ?? [],
    filtered: isReferenceFilterActive(input.references),
    random: options.random,
  });
  const chunks = collageChunks(parts);
  if (chunks.length === 0) {
    throw new GraphQLError('На полке нет текстов для склейки');
  }

  return {
    theme,
    promptId: prompt.id,
    parts,
    chunks,
    sources: collageSources(parts),
    collage: collageText(parts),
    system: buildScratchSystem(),
    user: buildScratchUser({ theme, authorPrompt: prompt.text, parts }),
  };
};

export type ScratchRequest = ReturnType<typeof assembleScratchRequest>;

export const buildScratchRequest = async (
  userId: number,
  input: ScratchInput,
  options: ScratchOptions = {}
): Promise<ScratchRequest> => {
  requireScratchTheme(input.theme);
  const [pool, stored] = await Promise.all([
    loadArtistPool(userId, input.references),
    options.prompt ? null : getCurrentPrompt(userId),
  ]);

  return assembleScratchRequest(
    input,
    pool,
    options.prompt ?? { id: stored?.id ?? null, text: stored?.text ?? '' },
    options
  );
};

const parseScratch = (text: string): string => {
  const aiText = stripModelWrapper(text);

  if (!aiText) {
    throw new AiProviderError('ИИ вернул пустой ответ');
  }

  return aiText;
};

export const callScratch = (userId: number, request: ScratchRequest) =>
  callModel(
    {
      userId,
      kind: 'SCRATCH',
      frameVersion: SCRATCH_FRAME_VERSION,
      promptId: request.promptId,
      system: request.system,
      user: request.user,
      maxTokens: env.AI_MAX_TOKENS,
    },
    parseScratch
  );

export const writeFromScratch = async (userId: number, input: ScratchInput) => {
  if (!isAiConfigured()) {
    throw new GraphQLError('ИИ не настроен');
  }

  const request = await buildScratchRequest(userId, input);
  const { value: aiText, usageId } = await callScratch(userId, request);

  return {
    aiText,
    usageId,
    sources: request.sources,
    collage: request.collage,
    close: findCloseLines(aiText, request.chunks),
  };
};
