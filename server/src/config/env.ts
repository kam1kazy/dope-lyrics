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
  INGEST_URL: z.string().optional().default('http://127.0.0.1:4071'),
  DATABASE_URL: postgresUrl,
  SITE_URL: z.string().optional().default(''),
  CORS_ORIGINS: z.string().optional().default(''),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5000),
  GRAPHQL_MAX_DEPTH: z.coerce.number().int().positive().default(8),
  GRAPHQL_MAX_LIMIT: z.coerce.number().int().positive().default(10_000),
  BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(512_000),
});

const parsedHttp = httpEnvSchema.safeParse(process.env);

if (!parsedHttp.success) {
  const details = parsedHttp.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Некорректные переменные окружения: ${details}`);
}

export const env = parsedHttp.data;

export const isProduction = env.NODE_ENV === 'production';

const requiredId = z
  .string()
  .min(1)
  .transform((value) => Number.parseInt(value, 10))
  .refine((value) => Number.isFinite(value), { message: 'invalid id' });

const botEnvSchema = z.object({
  API_ID: requiredId,
  API_HASH: z.string().min(1),
  BOT_TOKEN: z.string().min(1),
  BOT_PHONE: z.string().min(1),
  BOT_PASS: z.string().min(1),
  BOT_CHAT_ID: requiredId,
  BOT_CHANNEL_ID: requiredId,
  BOT_ADMIN_ID: z
    .string()
    .optional()
    .default('')
    .transform((value) => Number.parseInt(value, 10)),
  BOT_TYPE: z.string().optional().default(''),
  SITE_URL: z.string().optional().default(''),
  INGEST_PORT: z.coerce.number().int().positive().default(4071),
});

export type BotEnv = z.infer<typeof botEnvSchema>;

export function parseBotEnv(): BotEnv {
  const parsed = botEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const hasApi =
      Number.isFinite(Number.parseInt(process.env.API_ID ?? '', 10)) &&
      Boolean(process.env.API_HASH);

    throw new Error(
      hasApi
        ? 'Отсутствуют необходимые переменные окружения для бота!'
        : 'API_ID или API_HASH не установлены!'
    );
  }

  return parsed.data;
}
