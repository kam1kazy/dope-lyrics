import path from 'node:path';
import process from 'node:process';

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
});

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

export const {
  API_HASH,
  API_ID,
  BOT_TOKEN,
  BOT_PHONE,
  BOT_CHAT_ID,
  BOT_PASS,
  BOT_CHANNEL_ID,
  BOT_TYPE,
  BOT_ADMIN_ID,
  SITE_URL,
} = parsed.data;
