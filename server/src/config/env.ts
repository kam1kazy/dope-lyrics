import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import dotenv from 'dotenv';
import { z } from 'zod';

const envPath = path.resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const postgresUrl = z
  .string()
  .min(1, 'DATABASE_URL обязателен')
  .refine(
    (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
    { message: 'DATABASE_URL должен быть PostgreSQL connection string' }
  );

const httpEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: postgresUrl,
  SITE_URL: z.string().optional().default(''),
  CORS_ORIGINS: z.string().optional().default(''),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5000),
  GRAPHQL_MAX_DEPTH: z.coerce.number().int().positive().default(8),
  GRAPHQL_MAX_LIMIT: z.coerce.number().int().positive().default(10_000),
  BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(512_000),
});

const parsed = httpEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Некорректные переменные окружения: ${details}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
