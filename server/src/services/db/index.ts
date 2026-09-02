import { messageObject } from '~/handlers/db';
import { prisma } from '~/infrastructure/prisma';
import { IChatHistoryItem } from '~/types/prismaCreate';
import { IUser } from '~/types/user';

const INSERT_CONCURRENCY = 8;

export class PrismaService {
  private readonly prisma = prisma;

  async clearDatabase() {
    try {
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

  async loadNewRecords(records: IChatHistoryItem[]) {
    try {
      const userExists = await this.getOwner();

      if (!userExists) {
        console.log(`\nPRISMA: 🙅 Users не был найден`);
        return;
      }
      console.log(`\nPRISMA: 🫄 Пользователь UserID: ${userExists.id} найден`);
      console.log(`PRISMA: 📝 Начало загрузки ${records.length} записей`);

      const existing = await this.prisma.lyrics.findMany({
        select: { lyric_id: true },
      });
      const existingIds = new Set(existing.map((row) => row.lyric_id));

      const fresh = records.filter((item) => {
        const lyricId = item.message.message_id;
        return !existingIds.has(lyricId);
      });

      const skipped = records.length - fresh.length;
      if (skipped > 0) {
        console.log(`PRISMA: ⏭️ Пропущено дублей lyric_id: ${skipped}`);
      }

      let loaded = 0;

      for (let i = 0; i < fresh.length; i += INSERT_CONCURRENCY) {
        const batch = fresh.slice(i, i + INSERT_CONCURRENCY);
        await Promise.all(
          batch.map(async (item) => {
            try {
              await this.prisma.lyrics.create({
                data: messageObject(item, userExists.id),
              });
              existingIds.add(item.message.message_id);
              loaded += 1;
            } catch (error) {
              console.error(
                `PRISMA: 🚧 Данные Lyrics - lyric_id: ${item.message.message_id} - не удалось загрузить в базу\n\n`,
                error
              );
            }
          })
        );
      }

      console.log(`PRISMA: 📊 Итого загружено записей: ${loaded}`);
    } catch (error) {
      console.error('PRISMA: ❌ Ошибка при загрузке записей:', error);
    }
  }

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

export const prismaService = new PrismaService();
