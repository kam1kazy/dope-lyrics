import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { createApp } from '~/app/server';
import { prisma } from '~/infrastructure/prisma';
import {
  SESSION_COOKIE_NAME,
  sessionService,
} from '~/modules/auth/session.service';

const app = createApp();
const BASE = 'http://localhost';

let userId = 0;

beforeAll(async () => {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Users"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Users"), 1))`
  );

  const user = await prisma.users.create({
    data: {
      username: `auth_${Date.now()}`,
      telegramId: BigInt(`920000${Date.now().toString().slice(-6)}`),
      role: 'USER',
    },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.users.delete({ where: { id: userId } });
});

type PostInit = {
  headers?: Record<string, string>;
  body?: string;
};

const post = (path: string, init: PostInit = {}) =>
  app.handle(new Request(`${BASE}${path}`, { method: 'POST', ...init }));

const sessionCookie = (token: string) => ({
  cookie: `${SESSION_COOKIE_NAME}=${token}`,
});

describe('CSRF на /auth', () => {
  test('форма text/plain на вход — 403', async () => {
    const response = await post('/auth/telegram-webapp', {
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({ initData: 'user=%7B%7D&hash=x' }),
    });
    expect(response.status).toBe(403);
  });

  test('JSON доходит до проверки подписи — 401, не 403', async () => {
    const response = await post('/auth/telegram-webapp', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData: 'user=%7B%7D&hash=x' }),
    });
    expect(response.status).toBe(401);
  });

  test('чужой Origin — 403', async () => {
    const response = await post('/auth/telegram-webapp', {
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.example',
      },
      body: JSON.stringify({ initData: 'user=%7B%7D&hash=x' }),
    });
    expect(response.status).toBe(403);
  });

  test('logout без X-Requested-With — 403, с ним — 200', async () => {
    const { token } = await sessionService.create(userId);

    const blocked = await post('/auth/logout', {
      headers: sessionCookie(token),
    });
    expect(blocked.status).toBe(403);
    expect(await sessionService.resolveUser(token)).not.toBeNull();

    const allowed = await post('/auth/logout', {
      headers: {
        ...sessionCookie(token),
        'x-requested-with': 'XMLHttpRequest',
      },
    });
    expect(allowed.status).toBe(200);
    expect(await sessionService.resolveUser(token)).toBeNull();
  });
});

describe('ротация сессии', () => {
  test('после /auth/refresh старый токен не пускает, новый пускает', async () => {
    const { token: oldToken } = await sessionService.create(userId);

    const response = await post('/auth/refresh', {
      headers: {
        ...sessionCookie(oldToken),
        'x-requested-with': 'XMLHttpRequest',
      },
    });
    expect(response.status).toBe(200);

    const setCookie = response.headers.get('set-cookie') ?? '';
    const newToken = new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`).exec(
      setCookie
    )?.[1];
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(oldToken);

    expect(await sessionService.resolveUser(oldToken)).toBeNull();
    const user = await sessionService.resolveUser(
      decodeURIComponent(newToken ?? '')
    );
    expect(user?.id).toBe(userId);

    const replay = await post('/auth/refresh', {
      headers: {
        ...sessionCookie(oldToken),
        'x-requested-with': 'XMLHttpRequest',
      },
    });
    expect(replay.status).toBe(401);
  });
});
