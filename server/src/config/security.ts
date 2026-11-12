import { Elysia } from 'elysia';

import {
  type AuthUser,
  resolveAuthUser,
} from '~/modules/auth/resolve-auth-user';

import { isOriginAllowed } from './cors';
import { env, isProduction } from './env';

type RateBucket = {
  count: number;
  resetAt: number;
};

type RateBuckets = Map<string, RateBucket> & { sweepAt?: number };

const rateBuckets: RateBuckets = new Map();

/** Ведро по ключу за окно; протухшие ведра сметаем раз в окно, чтобы Map не рос по IP бесконечно. */
export const takeRateBucket = (
  buckets: RateBuckets,
  key: string,
  windowMs: number,
  now = Date.now()
): RateBucket => {
  if (now >= (buckets.sweepAt ?? 0)) {
    buckets.sweepAt = now + windowMs;
    for (const [bucketKey, bucket] of buckets) {
      if (now >= bucket.resetAt) {
        buckets.delete(bucketKey);
      }
    }
  }

  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  return bucket;
};

// X-Real-IP ставит nginx из $remote_addr; начало X-Forwarded-For клиент подделывает сам
export const clientIp = (request: Request): string => {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp;
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || 'unknown';
};

const isCsrfSafeAuthPost = (request: Request): boolean => {
  const contentType = request.headers.get('content-type') ?? '';
  return (
    contentType.includes('application/json') ||
    request.headers.get('x-requested-with') === 'XMLHttpRequest'
  );
};

const requestPath = (request: Request): string => {
  try {
    return new URL(request.url).pathname;
  } catch {
    return '/';
  }
};

export const securityPlugin = new Elysia({ name: 'security' })
  // Единственное место, где читается сессия: дальше authUser уходит в контекст yoga
  .derive({ as: 'global' }, async ({ request }) => {
    const path = requestPath(request);
    const method = request.method.toUpperCase();

    if (method === 'OPTIONS' || !path.startsWith('/graphql')) {
      return { authUser: null as AuthUser | null };
    }

    const authUser = await resolveAuthUser(request);
    return { authUser };
  })
  .onRequest(({ request, set }) => {
    const requestId =
      request.headers.get('x-request-id')?.trim() || crypto.randomUUID();
    set.headers['x-request-id'] = requestId;
    set.headers['x-content-type-options'] = 'nosniff';
    set.headers['x-frame-options'] = 'DENY';
    set.headers['referrer-policy'] = 'strict-origin-when-cross-origin';
    set.headers['x-dns-prefetch-control'] = 'off';
    set.headers['permissions-policy'] =
      'camera=(), microphone=(), geolocation=()';
    set.headers['x-permitted-cross-domain-policies'] = 'none';

    if (isProduction) {
      set.headers['strict-transport-security'] =
        'max-age=15552000; includeSubDomains';
    }
  })
  .onBeforeHandle(({ request, set, authUser }) => {
    const method = request.method.toUpperCase();
    const path = requestPath(request);

    if (method === 'OPTIONS' || path === '/health') {
      return;
    }

    const isAuthPath = path.startsWith('/auth/');
    const host = request.headers.get('host') ?? '';
    const isLocalHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);

    if (!isLocalHost && path.startsWith('/graphql')) {
      if (!authUser) {
        set.status = 401;
        return { error: 'Нет доступа' };
      }
    }

    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (
      Number.isFinite(contentLength) &&
      contentLength > env.BODY_LIMIT_BYTES
    ) {
      set.status = 413;
      return { error: 'Слишком большой запрос' };
    }

    const origin = request.headers.get('origin');
    if (origin && !isOriginAllowed(origin)) {
      set.status = 403;
      return { error: 'Origin не разрешён' };
    }

    if (isAuthPath && method === 'POST' && !isCsrfSafeAuthPost(request)) {
      set.status = 403;
      return { error: 'Запрос заблокирован' };
    }

    if (method !== 'GET' && method !== 'HEAD' && path.startsWith('/graphql')) {
      const contentType = request.headers.get('content-type') ?? '';
      const allowedType =
        contentType.includes('application/json') ||
        contentType.includes('application/graphql') ||
        contentType.includes('application/graphql-response+json') ||
        contentType.includes('multipart/mixed');

      if (!allowedType) {
        set.status = 415;
        return { error: 'Недопустимый Content-Type' };
      }
    }

    const bucket = takeRateBucket(
      rateBuckets,
      clientIp(request),
      env.RATE_LIMIT_WINDOW_MS
    );
    set.headers['x-ratelimit-limit'] = String(env.RATE_LIMIT_MAX);
    set.headers['x-ratelimit-remaining'] = String(
      Math.max(0, env.RATE_LIMIT_MAX - bucket.count)
    );
    set.headers['x-ratelimit-reset'] = String(Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > env.RATE_LIMIT_MAX) {
      set.status = 429;
      return {
        error: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
      };
    }
  })
  .onError({ as: 'global' }, ({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return { error: 'Некорректный запрос' };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'Не найдено' };
    }

    if (code === 'PARSE') {
      set.status = 400;
      return { error: 'Некорректное тело запроса' };
    }

    console.error('Ошибка на сервере:', error);
    set.status = 500;
    return { error: 'Внутренняя ошибка сервера' };
  })
  .as('global');

export const stopRateLimitCleanup = (): void => {
  rateBuckets.clear();
};
