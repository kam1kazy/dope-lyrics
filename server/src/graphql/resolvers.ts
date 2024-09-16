import { GraphQLContext } from './context'

export const resolvers = {
  Query: {
    users: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.prisma.users.findMany({
        include: {
          lyrics: {
            include: {
              message: {
                include: {
                  reactions: {
                    include: {
                      emojis: true,
                    },
                  },
                  hashtags: true,
                },
              },
              user: true,
              chat: true,
              media: true,
            },
          },
        },
      })
    },
    lyrics: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.prisma.lyrics.findMany({
        include: {
          message: {
            include: {
              reactions: {
                include: {
                  emojis: true,
                },
              },
              hashtags: true,
            },
          },
          user: true,
          chat: true,
          media: true,
        },
      })
    },
  },
}
