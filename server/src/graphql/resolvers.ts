import { GraphQLContext } from './context'

export const resolvers = {
  Query: {
    users: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      try {
        return context.prisma.user.findMany({
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
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(
            '🚧 Ошибка при получении пользователей: ' + error.message
          )
        } else {
          throw new Error(
            '🚧 Ошибка при получении пользователей: Unknown error'
          )
        }
      }
    },
    lyrics: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      try {
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
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error('🚧 Ошибка при получении текстов: ' + error.message)
        } else {
          throw new Error('🚧 Ошибка при получении текстов: Unknown error')
        }
      }
    },
  },
}
