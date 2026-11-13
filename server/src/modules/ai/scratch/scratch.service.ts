import { GraphQLError } from 'graphql';

import { env } from '~/config/env';
import type { SectionFacets } from '~/modules/ai/artists/pick';
import {
  loadArtistPool,
  type ReferenceFilter,
} from '~/modules/ai/artists/load';
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
import {
  buildScratchSystem,
  SCRATCH_FRAME_VERSION,
} from '~/modules/ai/scratch/frame';
import { pickScratchReferences } from '~/modules/ai/scratch/pick';
import {
  buildScratchUser,
  formatScratchForm,
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
  noReferences?: boolean;
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

/** Запрос «С нуля» из готовой полки и промпта, без базы и модели. */
export const assembleScratchRequest = (
  input: ScratchInput,
  pool: readonly ArtistProfile[],
  prompt: RewritePrompt,
  options: Pick<ScratchOptions, 'noReferences' | 'random'> = {}
) => {
  const theme = requireScratchTheme(input.theme);
  const form = formatScratchForm(parseTrackFormQuotas(input.form));
  if (form.length === 0) {
    throw new GraphQLError('В форме трека нет частей');
  }

  const references = options.noReferences
    ? []
    : pickScratchReferences(pool, {
        facets: parseFacets(input.facets),
        theme,
        chosenTextIds: input.references?.textIds ?? [],
        random: options.random,
      });

  return {
    theme,
    promptId: prompt.id,
    references,
    system: buildScratchSystem(),
    user: buildScratchUser({
      theme,
      authorPrompt: prompt.text,
      references,
      form,
    }),
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
    options.noReferences ? [] : loadArtistPool(userId, input.references),
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
    references: request.references.map(({ artistName, sample }) => ({
      textId: sample.id,
      artistName,
      title: sample.title,
    })),
  };
};
