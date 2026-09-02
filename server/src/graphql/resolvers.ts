import { env } from '~/config/env';
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
  demosOnly?: boolean | null;
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
        demosOnly: args.demosOnly,
      });
    },
  },
};
