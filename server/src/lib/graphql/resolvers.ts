// Context
import { GraphQLContext } from './context';

// Auth Mutations
import { loginUser } from '~/services/auth/login';
import { createUser } from '~/services/auth/createUser';
import { logoutUser } from '~/services/auth/logout';
import { createSession } from '~/services/auth/createSession';
import { deleteSession } from '~/services/auth/deleteSession';
import { revokeToken } from '~/services/auth/revokeToken';

// Auth Queries
import { getUser } from '~/services/users/me';
import { getUsers } from '~/services/users/getUsers';

// Lyrics
import { getLyrics } from '~/services/lyrics';

export const resolvers = {
  Query: {
    /**
     * Получить текущего аутентифицированного пользователя
     * @param prisma: PrismaClient
     * @param user: User
     * @returns Promise<User>
     */
    me: async (_: any, __: any, { prisma, user }: GraphQLContext) => getUser(user, prisma),

    /**
     * Получить список текстов с пагинацией
     * @param limit: number
     * @param offset: number
     * @param prisma: PrismaClient
     * @returns Promise<Lyric[]>
     */
    lyrics: async (
      _: any,
      { limit, offset }: { limit?: number; offset?: number },
      { prisma }: GraphQLContext
    ) => getLyrics(limit || 10, offset || 0, prisma),

    /**
     * Получить всех пользователей (только для админа)
     * @param prisma: PrismaClient
     * @param user: User
     * @returns Promise<User[]>
     */
    users: async (_: any, __: any, { prisma, user }: GraphQLContext) => getUsers(user, prisma),
  },

  Mutation: {
    /**
     * Регистрация нового пользователя
     * @param email: string
     * @param password: string
     * @param name: string
     * @param prisma: PrismaClient
     * @param setCookie: any
     * @returns Promise<void>
     */
    createUser: async (
      _: any,
      { email, password, name }: { email: string; password: string; name: string },
      { prisma , setCookie}: GraphQLContext
    ) => createUser(email, password, name, prisma, setCookie),

    /**
     * Вход пользователя
     * @param email: string
     * @param password: string
     * @param prisma: PrismaClient
     * @param setCookie: any
     * @returns Promise<void>
     */
    login: async (
      _: any,
      { email, password }: { email: string; password: string },
      { prisma , setCookie}: GraphQLContext
    ) => loginUser(email, password, prisma, setCookie),

    /**
     * Отозвать токен
     * @param refreshToken: string
     * @param prisma: PrismaClient
     * @returns Promise<void>
     */
    revokeToken: async (
      _: any,
      { refreshToken }: { refreshToken: string },
      { prisma }: GraphQLContext
    ) => revokeToken(refreshToken, prisma),


    /**
     * Выход пользователя
     * @param setCookie: any
     * @param prisma: PrismaClient
     * @param user: User
     * @returns Promise<void>
     */
    logout: async (_: any, __: any, { setCookie, prisma, user }: GraphQLContext) => logoutUser(prisma, setCookie, user),
    /**
     * Создание сессии
     * @param sessionToken: string
     * @param userId: string
     * @param refreshToken: string
     * @param expires: string
     * @param prisma: PrismaClient
     * @returns Promise<void>
     */
    createSession: async (
      _: any,
      { sessionToken, userId, refreshToken, expires }: { sessionToken: string; userId: string; refreshToken: string; expires: string },
      { prisma }: GraphQLContext
    ) => createSession(sessionToken, userId, refreshToken, expires, prisma),

    /**
     * Удаление сессии
     * @param sessionToken: string
     * @param prisma: PrismaClient
     * @returns Promise<void>
     */
    deleteSession: async (
      _: any,
      { sessionToken }: { sessionToken: string },
      { prisma }: GraphQLContext
      ) => deleteSession(sessionToken, prisma),
  },
};