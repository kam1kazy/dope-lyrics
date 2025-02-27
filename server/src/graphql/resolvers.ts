import { GraphQLContext } from './context'

export const resolvers = {
  Query: {
    lyrics: async (
      _parent: unknown,
      args: { limit?: number; offset?: number }, // Принимаем аргументы
      context: GraphQLContext
    ) => {
      try {
        return context.prisma.lyrics.findMany({
          take: args.limit || 500,  // Ограничение количества записей (по умолчанию 500)
          skip: args.offset || 0,   // Смещение (по умолчанию 0)
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
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error('🚧 Ошибка при получении текстов: ' + error.message);
        } else {
          throw new Error('🚧 Ошибка при получении текстов: Unknown error');
        }
      }
    },
  },
};
