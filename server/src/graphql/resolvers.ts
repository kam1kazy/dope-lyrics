// src/graphql/resolvers.ts
import { GraphQLContext } from './context';
import { sign } from 'jsonwebtoken';

export const resolvers = {
  Query: {
    /**
     * Получить текущего аутентифицированного пользователя
     */
    me: async (_: any, __: any, { prisma, user }: GraphQLContext) => {
      if (!user) throw new Error('Не аутентифицирован');
      const foundUser = await prisma.user.findUnique({
        where: { id: parseInt(user.id) },
        select: { id: true, email: true, name: true, role: true },
      });
      if (!foundUser) throw new Error('Пользователь не найден');
      return foundUser;
    },

    /**
     * Получить список текстов с пагинацией
     */
    lyrics: async (
      _: any,
      { limit, offset }: { limit?: number; offset?: number },
      { prisma }: GraphQLContext
    ) => {
      try {
        const lyrics = await prisma.lyrics.findMany({
          take: limit || 10,
          skip: offset || 0,
          orderBy: { date: 'desc' },
          include: {
            message: {
              include: {
                hashtags: true,
                reactions: { include: { emojis: true } },
              },
            },
          },
        });

        return lyrics.map(lyric => ({
          id: lyric.id.toString(),
          lyricId: lyric.lyricId.toString(),
          date: lyric.date.toISOString(),
          editDate: lyric.editDate?.toISOString(),
          isPinned: lyric.isPinned,
          isChannelPost: lyric.isChannelPost,
          replyToMessage: lyric.replyToMessage,
          userId: lyric.userId.toString(),
          createdAt: lyric.date.toISOString(),
          updatedAt: lyric.date.toISOString(),
          message: lyric.message ? {
            id: lyric.message.id.toString(),
            text: lyric.message.text,
            word_count: lyric.message.word_count,
            hashtags: lyric.message.hashtags ? {
              id: lyric.message.hashtags.id.toString(),
              count: lyric.message.hashtags.count,
              tags: lyric.message.hashtags.tags,
            } : null,
            reactions: lyric.message.reactions ? {
              id: lyric.message.reactions.id.toString(),
              totalCount: lyric.message.reactions.totalCount,
              emojis: lyric.message.reactions.emojis.map(emoji => ({
                id: emoji.id.toString(),
                emoji: emoji.emoji,
                count: emoji.count,
                order: emoji.order,
              })),
            } : null,
          } : null,
        }));
      } catch (error) {
        console.error('Ошибка получения текстов:', error);
        throw new Error('Не удалось получить тексты');
      }
    },

    /**
     * Получить всех пользователей (только для админа)
     */
    users: async (_: any, __: any, { prisma, user }: GraphQLContext) => {
      if (!user || user.role !== 'admin') throw new Error('Нет доступа');
      return prisma.user.findMany();
    },
  },

  Mutation: {
    /**
     * Регистрация нового пользователя
     */
    register: async (
      _: any,
      { email, password, name }: { email: string; password: string; name: string },
      { prisma }: GraphQLContext
    ) => {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) throw new Error('Пользователь уже существует');

      const hashedPassword = await Bun.password.hash(password, { algorithm: 'bcrypt' });
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name, role: 'user' },
      });

      const token = sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'supersecretkey', {
        expiresIn: '7d',
      });

      return { token, user };
    },

    /**
     * Вход пользователя
     */
    login: async (
      _: any,
      { email, password }: { email: string; password: string },
      { prisma }: GraphQLContext
    ) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error('Неверные учетные данные');

      const isValid = await Bun.password.verify(password, user.password as string);
      if (!isValid) throw new Error('Неверные учетные данные');

      const token = sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'supersecretkey', {
        expiresIn: '7d',
      });

      return { token, user };
    },

    /**
     * Выход пользователя
     */
    logout: async (_: any, __: any, { prisma }: GraphQLContext) => {
      return 'Успешный выход';
    },

    /**
     * Создание сессии
     */
    createSession: async (
      _: any,
      { sessionToken, userId, expires }: { sessionToken: string; userId: string; expires: string },
      { prisma }: GraphQLContext
    ) => {
      return prisma.session.create({
        data: { sessionToken, userId: parseInt(userId), expires: new Date(expires) },
      });
    },

    /**
     * Удаление сессии
     */
    deleteSession: async (
      _: any,
      { sessionToken }: { sessionToken: string },
      { prisma }: GraphQLContext
    ) => {
      return prisma.session.delete({ where: { sessionToken } });
    },
  },
};