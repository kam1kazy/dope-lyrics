import { env, telegramAdminId } from '~/config/env';
import type { UserRole } from '~/generated/prisma/client';
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
        role: true,
        telegramId: true,
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
      (await this.prisma.users.findFirst({
        where: { role: 'OWNER' },
        orderBy: { id: 'asc' },
      })) ??
      (await this.prisma.users.findUnique({ where: { id: 1 } })) ??
      (await this.prisma.users.findFirst())
    );
  }

  async findByTelegramId(telegramId: number | bigint) {
    return this.prisma.users.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
  }

  async findOrCreateByTelegramId({
    telegramId,
    username,
  }: {
    telegramId: number;
    username?: string | null;
  }) {
    const existing = await this.findByTelegramId(telegramId);
    if (existing) {
      const nextUsername =
        username?.trim() || existing.username || `tg_${telegramId}`;
      if (nextUsername !== existing.username) {
        return this.prisma.users.update({
          where: { id: existing.id },
          data: { username: nextUsername },
        });
      }
      return existing;
    }

    const isOwner =
      Number.isFinite(telegramAdminId) && telegramId === telegramAdminId;
    const role: UserRole = isOwner ? 'OWNER' : 'USER';

    return this.prisma.users.create({
      data: {
        telegramId: BigInt(telegramId),
        username: username?.trim() || `tg_${telegramId}`,
        role,
      },
    });
  }

  async ensureOwner() {
    const existing = await this.getOwner();
    if (existing) {
      console.log(`PRISMA: 🫄 UserID: ${existing.id} уже существует`);
      return existing;
    }

    if (!Number.isFinite(telegramAdminId) || telegramAdminId <= 0) {
      throw new Error(
        'PRISMA: не задан BOT_ADMIN_ID — нельзя создать владельца каталога'
      );
    }

    const created = await this.prisma.users.create({
      data: {
        id: 1,
        username: 'owner',
        telegramId: BigInt(telegramAdminId),
        role: 'OWNER',
      },
    });
    console.log(`PRISMA: 📝 Создан владелец каталога UserID: ${created.id}`);
    return created;
  }

  async loadUsers(users: IUser[]) {
    try {
      if (users.length === 0) {
        await this.ensureOwner();
        return;
      }

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
            role: id === 1 ? 'OWNER' : 'USER',
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
