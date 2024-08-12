import { GraphQLContext } from '../context'

export const resolvers = {
  Query: {
    lyrics: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.prisma.lyric.findMany()
    },
    hashtags: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.prisma.hashtag.findMany()
    },
  },
}
