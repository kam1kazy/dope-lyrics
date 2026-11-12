import { GraphQLError } from 'graphql';

import { env } from '~/config/env';
import { aiMutationResolvers, aiQueryResolvers } from '~/graphql/ai.resolvers';
import {
  referenceMutationResolvers,
  referenceQueryResolvers,
} from '~/graphql/references.resolvers';
import { applyIngestSource, fetchIngestSources } from '~/graphql/ingest-client';
import { can } from '~/modules/auth/permissions';
import { roleProfilesFromJson } from '~/modules/lyrics/lyric-facets';
import { lyricsService } from '~/modules/lyrics/lyrics.service';
import { invitesService } from '~/modules/users/invites.service';
import { usersService } from '~/modules/users/users.service';

import type { GraphQLContext } from './context';

type LyricsArgs = {
  limit?: number | null;
  offset?: number | null;
  tags?: string[] | null;
  keyword?: string | null;
  emojis?: string[] | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  referencesOnly?: boolean | null;
  favoritesOnly?: boolean | null;
  hiddenOnly?: boolean | null;
  censoredOnly?: boolean | null;
  includeCensored?: boolean | null;
  includeShelves?: string[] | null;
  excludeShelves?: string[] | null;
  demoName?: string | null;
  demosOnly?: boolean | null;
  oldestFirst?: boolean | null;
  shuffleSeed?: number | null;
  mood?: string[] | null;
  excludeMood?: string[] | null;
  delivery?: string[] | null;
  excludeDelivery?: string[] | null;
  songRole?: string[] | null;
  excludeSongRole?: string[] | null;
  readiness?: string[] | null;
  excludeReadiness?: string[] | null;
  energy?: string[] | null;
  excludeEnergy?: string[] | null;
  sources?: string[] | null;
  sortField?: 'CREATED' | 'ADDED' | null;
};

type UpdateLyricFlagsArgs = {
  id: number;
  isHidden?: boolean | null;
  isFavorite?: boolean | null;
  isReference?: boolean | null;
  isCensored?: boolean | null;
  isDonor?: boolean | null;
  isUsed?: boolean | null;
};

type UpdateLyricProfileArgs = {
  id: number;
  mood?: string[] | null;
  delivery?: string[] | null;
  roleProfiles?: unknown;
  readiness?: string | null;
  energy?: string | null;
};

type UpdateLyricTextArgs = {
  id: number;
  text: string;
};

type SplitLyricArgs = {
  id: number;
  afterLine: number;
};

type SliceLyricArgs = {
  id: number;
  ranges: { afterLine: number; untilLine: number }[];
  ripDonor: boolean;
};

type CatalogScopeArgs = {
  dateFrom?: string | null;
  dateTo?: string | null;
  includeShelves?: string[] | null;
  excludeShelves?: string[] | null;
  sources?: string[] | null;
};

type AssembleTrackFilter = {
  tags?: string[] | null;
  keyword?: string | null;
  emojis?: string[] | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  includeShelves?: string[] | null;
  excludeShelves?: string[] | null;
  mood?: string[] | null;
  excludeMood?: string[] | null;
  delivery?: string[] | null;
  excludeDelivery?: string[] | null;
  songRole?: string[] | null;
  excludeSongRole?: string[] | null;
  readiness?: string[] | null;
  excludeReadiness?: string[] | null;
  energy?: string[] | null;
  excludeEnergy?: string[] | null;
  sources?: string[] | null;
};

type AssembleTrackArgs = {
  form?: unknown;
  hideAdlibs?: boolean | null;
  filter?: AssembleTrackFilter | null;
};

type LikeCollageArgs = {
  slots: unknown;
};

type UnlikeCollageArgs = {
  id: number;
};

type GlueLyricsArgs = {
  slots: unknown;
  hideOriginals: boolean;
};

type SaveCarouselHistoryArgs = {
  lyricIds: number[];
  source: string;
};

type CarouselHistoryIdArgs = {
  id: number;
};

type LyricsByIdsArgs = {
  ids: number[];
};

function requireUser(context: GraphQLContext) {
  if (!context.user) {
    throw new GraphQLError('Нет доступа');
  }

  return context.user;
}

function requireInviter(context: GraphQLContext) {
  const user = requireUser(context);
  if (!can(user, 'users:invite')) {
    throw new GraphQLError('Нет доступа');
  }

  return user;
}

function lyricsListOptionsFromArgs(
  userId: number,
  args: LyricsArgs,
  limit: number,
  offset: number
) {
  return {
    userId,
    limit,
    offset,
    tags: args.tags,
    keyword: args.keyword,
    emojis: args.emojis,
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
    referencesOnly: args.referencesOnly,
    favoritesOnly: args.favoritesOnly,
    hiddenOnly: args.hiddenOnly,
    censoredOnly: args.censoredOnly,
    includeCensored: args.includeCensored,
    includeShelves: args.includeShelves,
    excludeShelves: args.excludeShelves,
    demoName: args.demoName,
    demosOnly: args.demosOnly,
    oldestFirst: args.oldestFirst,
    shuffleSeed: args.shuffleSeed,
    mood: args.mood,
    excludeMood: args.excludeMood,
    delivery: args.delivery,
    excludeDelivery: args.excludeDelivery,
    songRole: args.songRole,
    excludeSongRole: args.excludeSongRole,
    readiness: args.readiness,
    excludeReadiness: args.excludeReadiness,
    energy: args.energy,
    excludeEnergy: args.excludeEnergy,
    sources: args.sources,
    sortField: args.sortField,
  };
}

const clampLimit = (value: number | null | undefined): number => {
  const fallback = env.GRAPHQL_MAX_LIMIT;
  const requested = value ?? fallback;
  if (!Number.isFinite(requested) || requested < 0) {
    return 0;
  }
  return Math.min(Math.floor(requested), env.GRAPHQL_MAX_LIMIT);
};

const clampOffset = (value: number | null | undefined): number => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }
  return Math.floor(value);
};

export const resolvers = {
  Query: {
    ...aiQueryResolvers,
    ...referenceQueryResolvers,
    users: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireUser(context);
      if (!can(user, 'users:list')) {
        throw new GraphQLError('Нет доступа');
      }
      return usersService.list();
    },
    lyricTags: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireUser(context);
      return lyricsService.listTags(user.id);
    },
    lyricEmojis: (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.listEmojis(user.id);
    },
    lyricDemos: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireUser(context);
      return lyricsService.listDemos(user.id);
    },
    lyrics: (_parent: unknown, args: LyricsArgs, context: GraphQLContext) => {
      const user = requireUser(context);
      return lyricsService.list(
        lyricsListOptionsFromArgs(
          user.id,
          args,
          clampLimit(args.limit),
          clampOffset(args.offset)
        )
      );
    },
    profile: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireUser(context);
      return { id: user.id, username: user.username, role: user.role };
    },
    ingestSources: (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return fetchIngestSources(user.id);
    },
    myInvites: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      const user = requireInviter(context);
      const invites = await invitesService.listActive(user.id);
      return invites.map((invite) => ({
        id: invite.id,
        createdAt: invite.createdAt.toISOString(),
        expiresAt: invite.expiresAt.toISOString(),
      }));
    },
    catalogStats: (
      _parent: unknown,
      args: CatalogScopeArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.catalogStats(user.id, args);
    },
    catalogActivity: (
      _parent: unknown,
      args: CatalogScopeArgs & { days: number },
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.catalogActivity(user.id, args.days, args);
    },
    assembleTrack: (
      _parent: unknown,
      args: AssembleTrackArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.assembleTrack(user.id, args.form, args.filter);
    },
    lyricCollages: (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.listCollages(user.id);
    },
    lyricIds: (_parent: unknown, args: LyricsArgs, context: GraphQLContext) => {
      const user = requireUser(context);
      return lyricsService.listOrderedIds(
        lyricsListOptionsFromArgs(user.id, args, 0, 0)
      );
    },
    lyricsByIds: (
      _parent: unknown,
      args: LyricsByIdsArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.listByIds(user.id, args.ids);
    },
    carouselHistories: (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.listCarouselHistories(user.id);
    },
  },
  Mutation: {
    ...aiMutationResolvers,
    ...referenceMutationResolvers,
    updateLyricFlags: (
      _parent: unknown,
      args: UpdateLyricFlagsArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.updateFlags(user.id, args.id, {
        isHidden: args.isHidden ?? undefined,
        isFavorite: args.isFavorite ?? undefined,
        isReference: args.isReference ?? undefined,
        isCensored: args.isCensored ?? undefined,
        isDonor: args.isDonor ?? undefined,
        isUsed: args.isUsed ?? undefined,
      });
    },
    updateLyricProfile: (
      _parent: unknown,
      args: UpdateLyricProfileArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.updateProfile(user.id, args.id, {
        mood: args.mood,
        delivery: args.delivery,
        roleProfiles: args.roleProfiles,
        readiness: args.readiness,
        energy: args.energy,
      });
    },
    updateLyricText: (
      _parent: unknown,
      args: UpdateLyricTextArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.updateLyricText(user.id, args.id, args.text);
    },
    splitLyric: (
      _parent: unknown,
      args: SplitLyricArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.splitLyric(user.id, args.id, args.afterLine);
    },
    sliceLyric: (
      _parent: unknown,
      args: SliceLyricArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.sliceLyric(
        user.id,
        args.id,
        args.ranges,
        Boolean(args.ripDonor)
      );
    },
    ingestSource: (
      _parent: unknown,
      args: { key: string },
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return applyIngestSource(user.id, args.key);
    },
    createInvite: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      const user = requireInviter(context);
      const { code, expiresAt } = await invitesService.create(user.id);
      return { code, expiresAt: expiresAt.toISOString() };
    },
    revokeInvite: (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      const user = requireInviter(context);
      return invitesService.revoke(args.id, user.id);
    },
    likeCollage: (
      _parent: unknown,
      args: LikeCollageArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.likeCollage(user.id, args.slots);
    },
    unlikeCollage: (
      _parent: unknown,
      args: UnlikeCollageArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.unlikeCollage(user.id, args.id);
    },
    glueLyrics: (
      _parent: unknown,
      args: GlueLyricsArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.glueLyrics(
        user.id,
        args.slots,
        Boolean(args.hideOriginals)
      );
    },
    saveCarouselHistory: (
      _parent: unknown,
      args: SaveCarouselHistoryArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.saveCarouselHistory(
        user.id,
        args.lyricIds,
        args.source
      );
    },
    likeCarouselHistory: (
      _parent: unknown,
      args: CarouselHistoryIdArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.likeCarouselHistory(user.id, args.id);
    },
    unlikeCarouselHistory: (
      _parent: unknown,
      args: CarouselHistoryIdArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.unlikeCarouselHistory(user.id, args.id);
    },
    deleteCarouselHistory: (
      _parent: unknown,
      args: CarouselHistoryIdArgs,
      context: GraphQLContext
    ) => {
      const user = requireUser(context);
      return lyricsService.deleteCarouselHistory(user.id, args.id);
    },
  },
  Lyric: {
    roleProfiles: (parent: { roleProfiles?: unknown }) => {
      return roleProfilesFromJson(parent.roleProfiles);
    },
  },
};
