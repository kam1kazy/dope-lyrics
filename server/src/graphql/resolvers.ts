import { IUser } from '~/types/user';
import { GraphQLContext } from './context'

interface ILogin {
  email: IUser['email'];
  password: IUser['password'];
}

export const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
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
  Mutation: {
    login: async (_: any, { email, password }: ILogin, context: GraphQLContext) => {
      try {
        const user = await context.prisma.user.findUnique({ where: { email } });
        if (user && user.password === password) { // Замените на hashing в реальном проекте
          return { id: user.id, name: user.name, email: user.email };
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error('🚧 Ошибка при получении пользователя: ' + error.message);
        } else {
          throw new Error('🚧 Ошибка при получении пользователя: Unknown error');
        }
      }
    },
  }
};
