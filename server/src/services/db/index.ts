import { PrismaClient } from '@prisma/client';

import { messageObject } from '~/handlers/db';
import { IChatHistoryItem } from '~/types/prismaCreate';
import { IUser } from '~/types/user';

export class PrismaService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Очистка всей базы
  async clearDatabase() {
    try {
      // Удаляем данные в правильном порядке (из-за зависимостей)
      await this.prisma.emoji.deleteMany();
      await this.prisma.reactions.deleteMany();
      await this.prisma.hashtags.deleteMany();
      await this.prisma.message.deleteMany();
      await this.prisma.userLyric.deleteMany();
      await this.prisma.chat.deleteMany();
      await this.prisma.media.deleteMany();
      await this.prisma.lyrics.deleteMany();
      await this.prisma.users.deleteMany();

      console.log('PRISMA: 🗑 База данных очищена');
    } catch (error) {
      console.error('PRISMA: ❌ Ошибка при очистке базы:', error);
    }
  }

  private async getOwner() {
    return (
      (await this.prisma.users.findUnique({ where: { id: 1 } })) ??
      (await this.prisma.users.findFirst())
    );
  }

  // Загрузка пользователей
  async loadUsers(users: IUser[]) {
    try {
      const userExists = await this.getOwner();

      if (!userExists) {
        console.log(`\nPRISMA: 🙅 Users не был найден`);
        console.log(`PRISMA: 📝 Начало загрузки ${users.length} пользователей`);
        await this.prisma.users.createMany({
          data: users.map(({ id, username, email, password }) => ({
            id: id > 0 ? id : 1,
            username,
            email,
            password,
          })),
          skipDuplicates: true,
        });
      } else {
        console.log(`PRISMA: 🫄 UserID: ${userExists.id} уже существует`);
        return;
      }

      console.log(`PRISMA: 📊 Итого загружено пользователей: ${users.length}`);
    } catch (error) {
      console.error('PRISMA: ❌ Ошибка при загрузке пользователей:', error);
    }
  }

  // Загрузка новых записей с проверкой на дубликаты
  async loadNewRecords(records: IChatHistoryItem[]) {
    try {
      const userExists = await this.getOwner();

      if (!userExists) {
        console.log(`\nPRISMA: 🙅 Users не был найден`);
        return;
      }
      console.log(`\nPRISMA: 🫄 Пользователь UserID: ${userExists.id} найден`);

      console.log(`PRISMA: 📝 Начало загрузки ${records.length} записей`);

      const BATCH_SIZE = 1000;
      const duplicateFound = false;

      for (let i = 0; i < records.length && !duplicateFound; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        for (const item of batch) {
          try {
            // Создаем запись
            await this.prisma.lyrics.create({
              data: messageObject(item, userExists.id),
            });
          } catch (error) {
            console.error(
              'PRISMA: 🚧 Данные Lyrics - Iter: #' +
                i +
                ' - не удалось загрузить в базу\n\n',
              error
            );
          }
        }
      }

      console.log(`PRISMA: 📊 Итого загружено записей: ${records.length}`);
    } catch (error) {
      console.error('PRISMA: ❌ Ошибка при загрузке записей:', error);
    }
  }

  // Получение статистики
  async getStats() {
    try {
      const [users, lyrics, messages, reactions, hashtags, media] =
        await Promise.all([
          this.prisma.users.count(),
          this.prisma.lyrics.count(),
          this.prisma.message.count(),
          this.prisma.reactions.count(),
          this.prisma.hashtags.count(),
          this.prisma.media.count(),
        ]);

      const stats = {
        users,
        lyrics,
        messages,
        reactions,
        hashtags,
        media,
        lastUpdate: new Date().toISOString(),
      };

      console.log('PRISMA: 📊 Статистика базы данных:', stats);
      return stats;
    } catch (error) {
      console.error('PRISMA: ❌ Ошибка при получении статистики:', error);
      return null;
    }
  }
}

// Создаем и экспортируем экземпляр сервиса
export const prismaService = new PrismaService();
