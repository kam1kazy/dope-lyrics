import { GraphQLContext } from '../context'

export const resolvers = {
  Query: {
    user: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.prisma.user.findMany()
    },
    hashtags: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.prisma.hashtag.findMany()
    },
    lyrics: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.prisma.lyric.findMany()
    },
  },
}
