import { env } from '../config/env';
import type { GraphQLContext } from './context';
import { lyricInclude } from './lyric-include';

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
    users: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.prisma.users.findMany({
        select: {
          id: true,
          username: true,
          lyrics: {
            take: env.GRAPHQL_MAX_LIMIT,
            orderBy: { date: 'desc' },
            include: lyricInclude,
          },
        },
      });
    },
    lyrics: (
      _parent: unknown,
      args: ConnectionArgs,
      context: GraphQLContext
    ) => {
      return context.prisma.lyrics.findMany({
        take: clampLimit(args.limit),
        skip: clampOffset(args.offset),
        orderBy: { date: 'desc' },
        include: lyricInclude,
      });
    },
  },
};
