import { Elysia } from 'elysia';

import { isOriginAllowed } from './cors';
import { env, isProduction } from './env';

type RateBucket = {
  count: number;
  resetAt: number;
};

const rateBuckets = new Map<string, RateBucket>();

const clientIp = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
};

const requestPath = (request: Request): string => {
  try {
    return new URL(request.url).pathname;
  } catch {
    return '/';
  }
};

export const securityPlugin = new Elysia({ name: 'security' })
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
  .onBeforeHandle(({ request, set }) => {
    const method = request.method.toUpperCase();
    const path = requestPath(request);

    if (method === 'OPTIONS' || path === '/health') {
      return;
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

    const now = Date.now();
    const ip = clientIp(request);
    let bucket = rateBuckets.get(ip);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + env.RATE_LIMIT_WINDOW_MS };
      rateBuckets.set(ip, bucket);
    }

    bucket.count += 1;
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
