import { GraphQLContext } from './context'

export const resolvers = {
  Query: {
    users: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.prisma.users.findMany()
    },
    lyrics: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.prisma.lyrics.findMany()
    },
  },
}
