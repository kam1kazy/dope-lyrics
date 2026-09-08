import { createHash, randomBytes } from 'node:crypto';

import { env } from '~/config/env';
import { prisma } from '~/infrastructure/prisma';

export const SESSION_COOKIE_NAME = 'dl_session';

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const sessionMaxAgeMs = (): number => env.SESSION_MAX_AGE_SEC * 1000;

export type SessionUser = {
  id: number;
  role: 'OWNER' | 'ADMIN' | 'USER';
  username: string;
  telegramId: bigint | null;
};

export class SessionService {
  private readonly prisma = prisma;

  async create(userId: number): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + sessionMaxAgeMs());

    await this.prisma.session.create({
      data: {
        tokenHash: hashToken(token),
        userId,
        expiresAt,
      },
    });

    return { token, expiresAt };
  }

  async resolveUser(
    token: string | null | undefined
  ): Promise<SessionUser | null> {
    if (!token) {
      return null;
    }

    const row = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        owner: {
          select: {
            id: true,
            role: true,
            username: true,
            telegramId: true,
          },
        },
      },
    });

    if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return row.owner;
  }

  async rotate(
    token: string | null | undefined
  ): Promise<{ token: string; expiresAt: Date; user: SessionUser } | null> {
    if (!token) {
      return null;
    }

    const existing = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        revokedAt: true,
        owner: {
          select: {
            id: true,
            role: true,
            username: true,
            telegramId: true,
          },
        },
      },
    });

    if (
      !existing ||
      existing.revokedAt ||
      existing.expiresAt.getTime() <= Date.now()
    ) {
      return null;
    }

    await this.prisma.session.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const created = await this.create(existing.userId);
    return { ...created, user: existing.owner };
  }

  async revoke(token: string | null | undefined): Promise<void> {
    if (!token) {
      return;
    }

    await this.prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
      },
    });
    return result.count;
  }
}

export const sessionService = new SessionService();

export const sessionCookieOptions = (expiresAt: Date) => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  expires: expiresAt,
});

export const clearSessionCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  expires: new Date(0),
  maxAge: 0,
});

export const readSessionToken = (request: Request): string | null => {
  const cookie = request.headers.get('cookie');
  if (!cookie) {
    return null;
  }

  for (const part of cookie.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) {
      continue;
    }
    const key = part.slice(0, idx).trim();
    if (key !== SESSION_COOKIE_NAME) {
      continue;
    }
    const value = part.slice(idx + 1).trim();
    if (value) {
      return decodeURIComponent(value);
    }
  }

  return null;
};
