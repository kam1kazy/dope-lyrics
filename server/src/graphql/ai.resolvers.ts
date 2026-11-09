import { GraphQLError } from 'graphql';

import {
  rewriteCollage,
  type RewriteCollageInput,
} from '~/modules/ai/ai.service';
import {
  countPromptVersions,
  createPrompt,
  type CreatePromptInput,
  getCurrentPrompt,
  listPromptVersions,
} from '~/modules/ai/ai-prompt.service';
import { suggestPromptMeta } from '~/modules/ai/ai-prompt-meta';
import { recentUsage, usageSummary } from '~/modules/ai/ai-usage.service';
import { isAiConfigured } from '~/modules/ai/polza.client';
import { can } from '~/modules/auth/permissions';
import {
  createTrackText,
  type CreateTrackTextInput,
  deleteTrackText,
  getTrackText,
  listTrackTexts,
  markTrackTextDone,
  updateTrackText,
} from '~/modules/track-texts/track-texts.service';

import type { GraphQLContext } from './context';

const requireAi = (context: GraphQLContext) => {
  if (!can(context.user, 'ai:use')) {
    throw new GraphQLError('Нет доступа');
  }

  return context.user!;
};

const iso = (date: Date | null): string | null => date?.toISOString() ?? null;

const promptDto = (
  row: {
    id: number;
    text: string;
    name: string | null;
    description: string | null;
    createdAt: Date;
  },
  number: number
) => ({
  id: row.id,
  number,
  text: row.text,
  name: row.name,
  description: row.description,
  createdAt: row.createdAt.toISOString(),
});

const trackTextDto = (row: Awaited<ReturnType<typeof getTrackText>>) => ({
  id: row.id,
  createdAt: row.createdAt.toISOString(),
  theme: row.theme,
  sourceText: row.sourceText,
  aiText: row.aiText,
  text: row.text,
  finalText: row.finalText,
  doneAt: iso(row.doneAt),
});

export const aiQueryResolvers = {
  aiStatus: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    requireAi(context);
    return { enabled: isAiConfigured() };
  },
  aiPrompt: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext
  ) => {
    const user = requireAi(context);
    const [row, count] = await Promise.all([
      getCurrentPrompt(user.id),
      countPromptVersions(user.id),
    ]);
    return row ? promptDto(row, count) : null;
  },
  aiPromptVersions: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext
  ) => {
    const user = requireAi(context);
    const versions = await listPromptVersions(user.id);
    return versions.map((row, index) =>
      promptDto(row, versions.length - index)
    );
  },
  aiUsageSummary: (_parent: unknown, _args: unknown, context: GraphQLContext) =>
    usageSummary(requireAi(context).id),
  aiUsageRecent: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext
  ) => {
    const user = requireAi(context);
    return (await recentUsage(user.id)).map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      kind: row.kind,
      model: row.model,
      tokensIn: row.tokensIn,
      tokensOut: row.tokensOut,
      costRub: row.costRub === null ? null : Number(row.costRub),
      latencyMs: row.latencyMs,
      status: row.status,
      error: row.error,
    }));
  },
  trackTexts: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext
  ) => {
    const user = requireAi(context);
    return (await listTrackTexts(user.id)).map(trackTextDto);
  },
  trackText: async (
    _parent: unknown,
    args: { id: number },
    context: GraphQLContext
  ) => {
    const user = requireAi(context);
    return trackTextDto(await getTrackText(user.id, args.id));
  },
};

export const aiMutationResolvers = {
  createAiPrompt: async (
    _parent: unknown,
    args: CreatePromptInput,
    context: GraphQLContext
  ) => {
    const user = requireAi(context);

    try {
      const row = await createPrompt(user.id, args);
      return promptDto(row, await countPromptVersions(user.id));
    } catch (error: unknown) {
      throw new GraphQLError(
        error instanceof Error ? error.message : 'Не удалось создать промпт'
      );
    }
  },
  suggestAiPromptMeta: (
    _parent: unknown,
    args: { text: string },
    context: GraphQLContext
  ) => suggestPromptMeta(requireAi(context).id, args.text),
  rewriteCollage: (
    _parent: unknown,
    args: RewriteCollageInput,
    context: GraphQLContext
  ) => rewriteCollage(requireAi(context).id, args),
  createTrackText: async (
    _parent: unknown,
    args: CreateTrackTextInput,
    context: GraphQLContext
  ) => {
    const user = requireAi(context);
    return trackTextDto(await createTrackText(user.id, args));
  },
  updateTrackText: async (
    _parent: unknown,
    args: { id: number; text: string },
    context: GraphQLContext
  ) => {
    const user = requireAi(context);
    return trackTextDto(await updateTrackText(user.id, args.id, args.text));
  },
  deleteTrackText: async (
    _parent: unknown,
    args: { id: number },
    context: GraphQLContext
  ) => deleteTrackText(requireAi(context).id, args.id),
  markTrackTextDone: async (
    _parent: unknown,
    args: { id: number },
    context: GraphQLContext
  ) => {
    const user = requireAi(context);
    return trackTextDto(await markTrackTextDone(user.id, args.id));
  },
};
