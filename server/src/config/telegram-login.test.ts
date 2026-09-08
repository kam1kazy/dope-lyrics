import { createHash, createHmac, randomBytes } from 'node:crypto';

import { describe, expect, test } from 'bun:test';

import {
  type TelegramLoginPayload,
  verifyTelegramLoginUserId,
} from '~/config/telegram-login';

const BOT_TOKEN = '123456:ABC-DEF';

const signLogin = (
  payload: Omit<TelegramLoginPayload, 'hash'>
): TelegramLoginPayload => {
  const dataCheckString = Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('\n');

  const secretKey = createHash('sha256').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return { ...payload, hash };
};

describe('verifyTelegramLoginUserId', () => {
  test('принимает верную подпись', () => {
    const payload = signLogin({
      id: 42,
      first_name: 'Test',
      username: 'test_user',
      auth_date: Math.floor(Date.now() / 1000),
    });

    expect(
      verifyTelegramLoginUserId({
        payload,
        botToken: BOT_TOKEN,
        maxAgeSec: 86_400,
      })
    ).toBe(42);
  });

  test('отклоняет подделанный hash', () => {
    const payload = signLogin({
      id: 42,
      auth_date: Math.floor(Date.now() / 1000),
    });
    payload.hash = createHash('sha256').update(randomBytes(16)).digest('hex');

    expect(
      verifyTelegramLoginUserId({
        payload,
        botToken: BOT_TOKEN,
        maxAgeSec: 86_400,
      })
    ).toBeNull();
  });

  test('отклоняет просроченный auth_date', () => {
    const payload = signLogin({
      id: 42,
      auth_date: Math.floor(Date.now() / 1000) - 100_000,
    });

    expect(
      verifyTelegramLoginUserId({
        payload,
        botToken: BOT_TOKEN,
        maxAgeSec: 86_400,
      })
    ).toBeNull();
  });
});
