import { GraphQLContext } from './context';

interface ILogin {
  email: string;
  password: string;
}

export const resolvers = {
  Query: {
    hello: () => 'Hello, world!',
    lyrics: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      try {
        return context.prisma.lyrics.findMany({
          take: args.limit || 500,
          skip: args.offset || 0,
          include: {
            message: {
              include: {
                reactions: { include: { emojis: true } },
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
    user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      return context.prisma.user.findUnique({ where: { id: parseInt(id) } });
    },
    userByEmail: async (_: any, { email }: { email: string }, context: GraphQLContext) => {
      return context.prisma.user.findUnique({ where: { email } });
    },
    userByAccount: async (
      _: any,
      { provider, providerAccountId }: { provider: string; providerAccountId: string },
      context: GraphQLContext
    ) => {
      const account = await context.prisma.account.findFirst({
        where: { provider, providerAccountId },
        include: { user: true },
      });
      return account?.user || null;
    },
  },
  Mutation: {
    login: async (_: any, { email, password }: ILogin, context: GraphQLContext) => {
      try {
        const user = await context.prisma.user.findUnique({ where: { email } });
        if (user && user.password === password) {
          return { id: user.id, name: user.name, email: user.email };
        }
        throw new Error('Неверные учетные данные');
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error('🚧 Ошибка при входе: ' + error.message);
        } else {
          throw new Error('🚧 Ошибка при входе: Unknown error');
        }
      }
    },
    createUser: async (
      _: any,
      { name, email }: { name: string; email: string },
      context: GraphQLContext
    ) => {
      return context.prisma.user.create({
        data: { name, email, password: 'default', role: 'user' },
      });
    },
    updateUser: async (
      _: any,
      { id, name, email }: { id: string; name?: string; email?: string },
      context: GraphQLContext
    ) => {
      return context.prisma.user.update({
        where: { id: parseInt(id) },
        data: { name, email },
      });
    },
    linkAccount: async (
      _: any,
      { userId, provider, providerAccountId }: { userId: string; provider: string; providerAccountId: string },
      context: GraphQLContext
    ) => {
      return context.prisma.account.create({
        data: {
          userId: parseInt(userId),
          provider,
          providerAccountId,
          type: 'oauth',
        },
      });
    },
    createSession: async (
      _: any,
      { sessionToken, userId, expires }: { sessionToken: string; userId: string; expires: string },
      context: GraphQLContext
    ) => {
      console.log('Server: Creating session:', { sessionToken, userId, expires });
      const session = await context.prisma.session.create({
        data: {
          sessionToken,
          userId: parseInt(userId),
          expires: new Date(expires),
        },
      });
      console.log('Server: Session created:', session);
      return session;
    },
  },
};