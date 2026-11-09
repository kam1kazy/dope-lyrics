import { GraphQLError } from 'graphql';

import {
  rewriteCollage,
  type RewriteCollageInput,
} from '~/modules/ai/ai.service';
import {
  getCurrentPrompt,
  listPromptVersions,
  savePrompt,
} from '~/modules/ai/ai-prompt.service';
import { recentUsage, usageSummary } from '~/modules/ai/ai-usage.service';
import { isAiConfigured } from '~/modules/ai/polza.client';
import { can } from '~/modules/auth/permissions';
import {
  createTrackText,
  type CreateTrackTextInput,
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

const promptDto = (row: { id: number; text: string; createdAt: Date }) => ({
  id: row.id,
  text: row.text,
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
    const row = await getCurrentPrompt(user.id);
    return row ? promptDto(row) : null;
  },
  aiPromptVersions: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext
  ) => {
    const user = requireAi(context);
    return (await listPromptVersions(user.id)).map(promptDto);
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
  saveAiPrompt: async (
    _parent: unknown,
    args: { text: string },
    context: GraphQLContext
  ) => {
    const user = requireAi(context);
    return promptDto(await savePrompt(user.id, args.text));
  },
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
  markTrackTextDone: async (
    _parent: unknown,
    args: { id: number },
    context: GraphQLContext
  ) => {
    const user = requireAi(context);
    return trackTextDto(await markTrackTextDone(user.id, args.id));
  },
};
