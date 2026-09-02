import { env, isProduction } from './env';

const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
];

const originFromSiteUrl = (raw: string): string[] => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return [trimmed.replace(/\/$/, '')];
  }

  return [`https://${trimmed}`, `http://${trimmed}`];
};

const extraOrigins = env.CORS_ORIGINS.split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export const allowedOrigins: string[] = [
  ...originFromSiteUrl(env.SITE_URL),
  ...extraOrigins,
  ...(isProduction ? [] : LOCAL_ORIGINS),
].filter((origin, index, list) => list.indexOf(origin) === index);

export const isOriginAllowed = (origin: string): boolean => {
  if (!origin || typeof origin !== 'string') {
    return false;
  }

  if (/[<>"']/.test(origin)) {
    return false;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (!isProduction) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/i.test(origin);
  }

  return false;
};
