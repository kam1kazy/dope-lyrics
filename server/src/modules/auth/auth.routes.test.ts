import { createHmac } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { createApp } from '~/app/server';
import { env } from '~/config/env';
import { prisma } from '~/infrastructure/prisma';
import {
  SESSION_COOKIE_NAME,
  sessionService,
} from '~/modules/auth/session.service';
import { invitesService } from '~/modules/users/invites.service';

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

describe('список пользователей', () => {
  const graphql = async (token: string, query: string) => {
    const response = await post('/graphql', {
      headers: {
        ...sessionCookie(token),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    return (await response.json()) as {
      data?: unknown;
      errors?: { message: string }[];
    };
  };

  test('USER не получает список учёток', async () => {
    const { token } = await sessionService.create(userId);
    const result = await graphql(token, '{ users { id username } }');
    expect(result.errors?.[0]?.message).toBe('Нет доступа');
  });

  test('через учётки нельзя дотянуться до чужих фраз', async () => {
    const { token } = await sessionService.create(userId);
    const result = await graphql(token, '{ users { id lyrics { id } } }');
    expect(result.data).toBeUndefined();
    expect(result.errors?.[0]?.message).toContain('lyrics');
  });
});

describe('вход только по приглашению', () => {
  const TEST_BOT_TOKEN = '123456:invite-test';
  const realBotToken = env.BOT_TOKEN;
  const strangerTg = Number(`94${Date.now().toString().slice(-8)}`);

  beforeAll(() => {
    env.BOT_TOKEN = TEST_BOT_TOKEN;
  });

  afterAll(async () => {
    env.BOT_TOKEN = realBotToken;
    await prisma.users.deleteMany({
      where: { telegramId: BigInt(strangerTg) },
    });
  });

  const signInitData = (telegramId: number): string => {
    const params = new URLSearchParams({
      user: JSON.stringify({ id: telegramId, username: 'invite_test' }),
      auth_date: String(Math.floor(Date.now() / 1000)),
    });
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(TEST_BOT_TOKEN)
      .digest();
    params.set(
      'hash',
      createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    );
    return params.toString();
  };

  const loginWebApp = (telegramId: number) =>
    post('/auth/telegram-webapp', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData: signInitData(telegramId) }),
    });

  test('незнакомый аккаунт — 403, ни учётки, ни сессии', async () => {
    const response = await loginWebApp(strangerTg);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Доступ по приглашению' });
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(
      await prisma.users.findUnique({
        where: { telegramId: BigInt(strangerTg) },
      })
    ).toBeNull();

    const graphql = await post('/graphql', {
      headers: {
        'content-type': 'application/json',
        'x-telegram-init-data': signInitData(strangerTg),
      },
      body: JSON.stringify({ query: '{ lyrics(limit: 1) { id } }' }),
    });
    expect(graphql.status).toBe(401);
    expect(
      await prisma.users.findUnique({
        where: { telegramId: BigInt(strangerTg) },
      })
    ).toBeNull();
  });

  test('после приглашения вход проходит', async () => {
    const { code } = await invitesService.create(userId);
    const redeemed = await invitesService.redeem({
      code,
      telegramId: strangerTg,
    });
    expect(redeemed.status).toBe('created');

    const response = await loginWebApp(strangerTg);
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain(SESSION_COOKIE_NAME);
  });
});
