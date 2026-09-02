import { env } from '~/config/env';
import { lyricsService } from '~/modules/lyrics/lyrics.service';
import { usersService } from '~/modules/users/users.service';

import type { GraphQLContext } from './context';

type ConnectionArgs = {
  limit?: number | null;
  offset?: number | null;
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
    lyrics: (
      _parent: unknown,
      args: ConnectionArgs,
      _context: GraphQLContext
    ) => {
      return lyricsService.list(
        clampLimit(args.limit),
        clampOffset(args.offset)
      );
    },
  },
};
