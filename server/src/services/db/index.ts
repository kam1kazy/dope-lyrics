// Handlers
import { messageSeedObject } from '~/handlers/db/messageSeedObject'
import { userSeedObject } from '~/handlers/db/userSeedObject'

// Types
import { IChatHistoryItem } from '~/types/prismaCreate'
import { IUser } from '~/types/user'

// PRISMA
import { prisma } from '~/lib/prisma'

export class PrismaService {
  private prisma: typeof prisma

  constructor() {
    this.prisma = prisma
  }

  // Очистка всей базы
  async clearDatabase() {
    try {
      // Удаляем данные в правильном порядке (из-за зависимостей)
      await this.prisma.emoji.deleteMany()
      await this.prisma.reactions.deleteMany()
      await this.prisma.hashtags.deleteMany()
      await this.prisma.message.deleteMany()
      await this.prisma.userLyric.deleteMany()
      await this.prisma.chat.deleteMany()
      await this.prisma.media.deleteMany()
      await this.prisma.lyrics.deleteMany()
      await this.prisma.user.deleteMany()

      console.log('PRISMA: 🗑 База данных очищена')
    } catch (error) {
      console.error('PRISMA: ❌ Ошибка при очистке базы:', error)
    }
  }

  // Загрузка пользователей
  async loadUsers(users: IUser[]) {
    console.log('Начинаем загрузку пользователей:', users.length);
    console.log(`PRISMA: 📝 Начало загрузки ${users.length} пользователей`)

    try {
      // Используем транзакцию для массовой загрузки записей через .upsert
      await this.prisma.$transaction(
        users.map(user => this.prisma.user.upsert({
          where: { email: user.email },
          create: {
            id: user.id,
            name: user.name,
            password: user.password,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            role: user.role,
            accounts: {
              create: user.accounts.map(account => ({
                userId: user.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              })),
            },
            sessions: {
              create: user.sessions.map(session => ({
                sessionToken: session.sessionToken,
                refreshToken: session.refreshToken,
                expires: session.expires,
              })),
            },
          },
          update: {
            name: user.name,
            password: user.password,
            emailVerified: user.emailVerified,
            image: user.image,
            role: user.role,
          },
        })),
      )
    } catch (error) {
      console.error('PRISMA: 🚧 Данные пользователя - не удалось загрузить в базу\n\n', error)
    }

    console.log('Загрузка пользователей завершена.');
    console.log(`PRISMA: 📊 Итого загружено пользователей: ${users.length}`)
  }

  async loadNewRecords(records: IChatHistoryItem[]) {
    try {
      console.log(`PRISMA: 📝 Начало загрузки ${records.length} записей`)

      const userId = 0

      const BATCH_SIZE = 1000
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE)

        await this.prisma.$transaction(
          batch.map(item =>
            this.prisma.lyrics.upsert({
              where: { id: userId },
              create:  {
                ...messageSeedObject(item, userId),
              },
              update: {
                ...messageSeedObject(item, userId, true),
              },
            }),
          ),
        )
      }

      console.log(`PRISMA: 📊 Итого загружено записей: ${records.length}`)
    } catch (error) {
      console.error('PRISMA: ❌ Ошибка при загрузке записей:', error)
    }
  }

  // Получение статистики
  async getStats() {
    try {
      const [users, lyrics, messages, reactions, hashtags, media] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.lyrics.count(),
        this.prisma.message.count(),
        this.prisma.reactions.count(),
        this.prisma.hashtags.count(),
        this.prisma.media.count(),
      ])

      const stats = {
        users,
        lyrics,
        messages,
        reactions,
        hashtags,
        media,
        lastUpdate: new Date().toISOString(),
      }

      console.log('PRISMA: 📊 Статистика базы данных:', stats)
      return stats
    } catch (error) {
      console.error('PRISMA: ❌ Ошибка при получении статистики:', error)
      return null
    }
  }
}

// Создаем и экспортируем экземпляр сервиса
export const prismaService = new PrismaService()

export const getAllUsers = async () => {
  return await prisma.user.findMany(); // Предположим, что у вас есть модель User
};
