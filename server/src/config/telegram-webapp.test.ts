import { createHmac, timingSafeEqual } from 'node:crypto';

import { describe, expect, test } from 'bun:test';

import { verifyTelegramWebAppUserId } from '~/config/telegram-webapp';

const BOT_TOKEN = '123456:ABC-DEF';

const signInitData = (fields: Record<string, string>): string => {
  const params = new URLSearchParams(fields);
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();
  const hash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  params.set('hash', hash);
  return params.toString();
};

describe('verifyTelegramWebAppUserId', () => {
  test('принимает верную подпись', () => {
    const initData = signInitData({
      user: JSON.stringify({ id: 42, username: 'test' }),
      auth_date: String(Math.floor(Date.now() / 1000)),
    });

    expect(
      verifyTelegramWebAppUserId({
        initData,
        botToken: BOT_TOKEN,
        maxAgeSec: 86_400,
      })
    ).toBe(42);
  });

  test('отклоняет подделанный hash', () => {
    const initData = signInitData({
      user: JSON.stringify({ id: 42 }),
      auth_date: String(Math.floor(Date.now() / 1000)),
    });
    const broken = initData.replace(/hash=[^&]+/, 'hash=deadbeef');

    expect(
      verifyTelegramWebAppUserId({
        initData: broken,
        botToken: BOT_TOKEN,
        maxAgeSec: 86_400,
      })
    ).toBeNull();
  });

  test('отклоняет просроченный auth_date', () => {
    const initData = signInitData({
      user: JSON.stringify({ id: 42 }),
      auth_date: String(Math.floor(Date.now() / 1000) - 200_000),
    });

    expect(
      verifyTelegramWebAppUserId({
        initData,
        botToken: BOT_TOKEN,
        maxAgeSec: 86_400,
      })
    ).toBeNull();
  });

  test('timingSafeEqual не сравнивает разную длину', () => {
    const left = Buffer.from('abc');
    const right = Buffer.from('abcd');
    expect(left.length === right.length).toBe(false);
    expect(() => timingSafeEqual(left, right)).toThrow();
  });
});
