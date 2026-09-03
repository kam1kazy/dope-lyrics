import { env } from '~/config/env';
import { fetchIngestApply, fetchIngestPreview } from '~/graphql/ingest-client';
import { roleProfilesFromJson } from '~/modules/lyrics/lyric-facets';
import { lyricsService } from '~/modules/lyrics/lyrics.service';
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
};

type UpdateLyricFlagsArgs = {
  id: number;
  isHidden?: boolean | null;
  isFavorite?: boolean | null;
  isReference?: boolean | null;
  isCensored?: boolean | null;
};

type UpdateLyricProfileArgs = {
  id: number;
  mood?: string[] | null;
  delivery?: string[] | null;
  roleProfiles?: unknown;
  readiness?: string | null;
};

type AssembleTrackArgs = {
  preset?: string | null;
  hideAdlibs?: boolean | null;
};

type LikeCollageArgs = {
  slots: unknown;
};

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
    users: (_parent: unknown, _args: unknown, _context: GraphQLContext) => {
      return usersService.list();
    },
    lyricTags: (_parent: unknown, _args: unknown, _context: GraphQLContext) => {
      return lyricsService.listTags();
    },
    lyricEmojis: (
      _parent: unknown,
      _args: unknown,
      _context: GraphQLContext
    ) => {
      return lyricsService.listEmojis();
    },
    lyricDemos: (
      _parent: unknown,
      _args: unknown,
      _context: GraphQLContext
    ) => {
      return lyricsService.listDemos();
    },
    lyrics: (_parent: unknown, args: LyricsArgs, _context: GraphQLContext) => {
      return lyricsService.list({
        limit: clampLimit(args.limit),
        offset: clampOffset(args.offset),
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
      });
    },
    lyricIngestPreview: (
      _parent: unknown,
      _args: unknown,
      _context: GraphQLContext
    ) => {
      return fetchIngestPreview();
    },
    catalogStats: (
      _parent: unknown,
      _args: unknown,
      _context: GraphQLContext
    ) => {
      return lyricsService.catalogStats();
    },
    assembleTrack: (
      _parent: unknown,
      args: AssembleTrackArgs,
      _context: GraphQLContext
    ) => {
      return lyricsService.assembleTrack(args.preset);
    },
    lyricCollages: (
      _parent: unknown,
      _args: unknown,
      _context: GraphQLContext
    ) => {
      return lyricsService.listCollages();
    },
  },
  Mutation: {
    updateLyricFlags: (
      _parent: unknown,
      args: UpdateLyricFlagsArgs,
      _context: GraphQLContext
    ) => {
      return lyricsService.updateFlags(args.id, {
        isHidden: args.isHidden ?? undefined,
        isFavorite: args.isFavorite ?? undefined,
        isReference: args.isReference ?? undefined,
        isCensored: args.isCensored ?? undefined,
      });
    },
    updateLyricProfile: (
      _parent: unknown,
      args: UpdateLyricProfileArgs,
      _context: GraphQLContext
    ) => {
      return lyricsService.updateProfile(args.id, {
        mood: args.mood,
        delivery: args.delivery,
        roleProfiles: args.roleProfiles,
        readiness: args.readiness,
      });
    },
    ingestPendingLyrics: (
      _parent: unknown,
      _args: unknown,
      _context: GraphQLContext
    ) => {
      return fetchIngestApply();
    },
    likeCollage: (
      _parent: unknown,
      args: LikeCollageArgs,
      _context: GraphQLContext
    ) => {
      return lyricsService.likeCollage(args.slots);
    },
  },
  Lyric: {
    roleProfiles: (parent: { roleProfiles?: unknown }) => {
      return roleProfilesFromJson(parent.roleProfiles);
    },
  },
};
