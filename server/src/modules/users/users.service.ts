import { env } from '~/config/env';
import { lyricInclude } from '~/graphql/lyric-include';
import { prisma } from '~/infrastructure/prisma';
import type { IUser } from '~/modules/users/users.types';

export class UsersService {
  private readonly prisma = prisma;

  list() {
    return this.prisma.users.findMany({
      select: {
        id: true,
        username: true,
        lyrics: {
          take: env.GRAPHQL_MAX_LIMIT,
          orderBy: { date: 'desc' },
          include: lyricInclude,
        },
      },
    });
  }

  async getOwner() {
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
}

export const usersService = new UsersService();
