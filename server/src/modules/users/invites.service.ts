import { createHash, randomBytes } from 'node:crypto';

import { Prisma } from '~/generated/prisma/client';
import { prisma } from '~/infrastructure/prisma';
import { usersService } from '~/modules/users/users.service';

export const INVITE_TTL_DAYS = 7;
const INVITE_TTL_MS = INVITE_TTL_DAYS * 24 * 60 * 60 * 1000;

const hashCode = (code: string): string =>
  createHash('sha256').update(code).digest('hex');

const activeWhere = (now: Date) => ({
  usedAt: null,
  revokedAt: null,
  expiresAt: { gt: now },
});

export type RedeemResult =
  | { status: 'created'; userId: number }
  | { status: 'already-member'; userId: number }
  | { status: 'invalid' };

export class InvitesService {
  private readonly prisma = prisma;

  async create(
    createdById: number
  ): Promise<{ code: string; expiresAt: Date }> {
    const code = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    await this.prisma.invite.create({
      data: { codeHash: hashCode(code), createdById, expiresAt },
    });

    return { code, expiresAt };
  }

  listActive(createdById: number) {
    return this.prisma.invite.findMany({
      where: { createdById, ...activeWhere(new Date()) },
      select: { id: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(inviteId: number, createdById: number): Promise<boolean> {
    const result = await this.prisma.invite.updateMany({
      where: { id: inviteId, createdById, ...activeWhere(new Date()) },
      data: { revokedAt: new Date() },
    });

    return result.count > 0;
  }

  async redeem({
    code,
    telegramId,
    username,
  }: {
    code: string;
    telegramId: number;
    username?: string | null;
  }): Promise<RedeemResult> {
    const existing = await usersService.findByTelegramId(telegramId);
    if (existing) {
      return { status: 'already-member', userId: existing.id };
    }

    const now = new Date();

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Условный updateMany держит строку до конца транзакции: второй аккаунт с тем же кодом получит count = 0
        const claimed = await tx.invite.updateMany({
          where: { codeHash: hashCode(code), ...activeWhere(now) },
          data: { usedAt: now },
        });
        if (claimed.count === 0) {
          return { status: 'invalid' } as const;
        }

        const user = await tx.users.create({
          data: {
            telegramId: BigInt(telegramId),
            username: username?.trim() || `tg_${telegramId}`,
            role: 'USER',
          },
        });

        await tx.invite.update({
          where: { codeHash: hashCode(code) },
          data: { usedById: user.id },
        });

        return { status: 'created', userId: user.id } as const;
      });
    } catch (error: unknown) {
      // Тот же аккаунт открыл ссылку дважды одновременно — учётка уже заведена первым запросом
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const user = await usersService.findByTelegramId(telegramId);
        if (user) {
          return { status: 'already-member', userId: user.id };
        }
      }
      throw error;
    }
  }
}

export const invitesService = new InvitesService();
