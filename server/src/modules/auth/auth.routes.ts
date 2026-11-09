import { Elysia, t } from 'elysia';

import { env } from '~/config/env';
import { clientIp } from '~/config/security';
import {
  type TelegramLoginPayload,
  verifyTelegramLoginUserId,
} from '~/config/telegram-login';
import { verifyTelegramWebAppUserId } from '~/config/telegram-webapp';
import {
  clearSessionCookieOptions,
  readSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  sessionService,
} from '~/modules/auth/session.service';
import { usersService } from '~/modules/users/users.service';

const authRateBuckets = new Map<string, { count: number; resetAt: number }>();

const consumeAuthRate = (request: Request): boolean => {
  const now = Date.now();
  const ip = clientIp(request);
  let bucket = authRateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = {
      count: 0,
      resetAt: now + env.AUTH_RATE_LIMIT_WINDOW_MS,
    };
    authRateBuckets.set(ip, bucket);
  }
  bucket.count += 1;
  return bucket.count <= env.AUTH_RATE_LIMIT_MAX;
};

const publicUser = (user: {
  id: number;
  username: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
}) => ({
  id: user.id,
  username: user.username,
  role: user.role,
});

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/telegram-webapp', async ({ request, set, cookie }) => {
    if (!consumeAuthRate(request)) {
      set.status = 429;
      return { error: 'Слишком много попыток входа' };
    }

    let body: { initData?: string };
    try {
      body = (await request.json()) as { initData?: string };
    } catch {
      set.status = 400;
      return { error: 'Некорректный запрос' };
    }

    const telegramId = verifyTelegramWebAppUserId({
      initData: body.initData ?? '',
      botToken: env.BOT_TOKEN,
      maxAgeSec: env.TELEGRAM_INIT_DATA_MAX_AGE_SEC,
    });

    if (telegramId === null) {
      set.status = 401;
      return { error: 'Нет доступа' };
    }

    let username: string | undefined;
    try {
      const params = new URLSearchParams(body.initData ?? '');
      const userRaw = params.get('user');
      if (userRaw) {
        const parsed: unknown = JSON.parse(userRaw);
        if (
          parsed &&
          typeof parsed === 'object' &&
          'username' in parsed &&
          typeof parsed.username === 'string'
        ) {
          username = parsed.username;
        }
      }
    } catch {
      username = undefined;
    }

    const user = await usersService.findOrCreateByTelegramId({
      telegramId,
      username,
    });
    const session = await sessionService.create(user.id);
    cookie[SESSION_COOKIE_NAME].set({
      value: session.token,
      ...sessionCookieOptions(session.expiresAt),
    });

    return { user: publicUser(user) };
  })
  .post(
    '/telegram-login',
    async ({ request, set, cookie, body }) => {
      if (!consumeAuthRate(request)) {
        set.status = 429;
        return { error: 'Слишком много попыток входа' };
      }

      const payload = body as TelegramLoginPayload;
      const telegramId = verifyTelegramLoginUserId({
        payload,
        botToken: env.BOT_TOKEN,
        maxAgeSec: env.TELEGRAM_INIT_DATA_MAX_AGE_SEC,
      });

      if (telegramId === null) {
        set.status = 401;
        return { error: 'Нет доступа' };
      }

      const user = await usersService.findOrCreateByTelegramId({
        telegramId,
        username: payload.username,
      });
      const session = await sessionService.create(user.id);
      cookie[SESSION_COOKIE_NAME].set({
        value: session.token,
        ...sessionCookieOptions(session.expiresAt),
      });

      return { user: publicUser(user) };
    },
    {
      body: t.Object({
        id: t.Numeric(),
        first_name: t.Optional(t.String()),
        last_name: t.Optional(t.String()),
        username: t.Optional(t.String()),
        photo_url: t.Optional(t.String()),
        auth_date: t.Numeric(),
        hash: t.String(),
      }),
    }
  )
  .post('/refresh', async ({ request, set, cookie }) => {
    const token = readSessionToken(request);
    const rotated = await sessionService.rotate(token);
    if (!rotated) {
      cookie[SESSION_COOKIE_NAME].set({
        value: '',
        ...clearSessionCookieOptions(),
      });
      set.status = 401;
      return { error: 'Нет доступа' };
    }

    cookie[SESSION_COOKIE_NAME].set({
      value: rotated.token,
      ...sessionCookieOptions(rotated.expiresAt),
    });

    return { user: publicUser(rotated.user) };
  })
  .post('/logout', async ({ request, cookie }) => {
    await sessionService.revoke(readSessionToken(request));
    cookie[SESSION_COOKIE_NAME].set({
      value: '',
      ...clearSessionCookieOptions(),
    });
    return { ok: true };
  })
  .get('/me', async ({ request, set }) => {
    const user = await sessionService.resolveUser(readSessionToken(request));
    if (!user) {
      set.status = 401;
      return { error: 'Нет доступа' };
    }
    return { user: publicUser(user) };
  });
