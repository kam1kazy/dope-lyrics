import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { prisma } from '~/infrastructure/prisma';
import { lyricsService } from '~/modules/lyrics/lyrics.service';
import type { IChatHistoryItem } from '~/modules/lyrics/lyrics.types';

const BASE_TG = Number(`94${Date.now().toString().slice(-8)}`);
const CHAT_A = -1009000000001;
const CHAT_B = -1009000000002;

let userId = 0;

const record = (chatId: number, messageId: number): IChatHistoryItem => ({
  userId: 0,
  message: {
    text: `строка ${chatId} ${messageId}`,
    message_id: messageId,
    word_count: 2,
    paragraph_count: 1,
    reactions: null,
    hashtags: null,
  },
  user: { id: 1, username: 'author', displayName: 'author', isAdmin: false },
  chat: { id: chatId, title: `чат ${chatId}`, type: 'channel' },
  date: new Date(),
  editDate: null,
  isPinned: false,
  isChannelPost: true,
  replyToMessage: null,
  media: null,
});

beforeAll(async () => {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Users"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Users"), 1))`
  );
  const user = await prisma.users.create({
    data: {
      username: `load_${BASE_TG}`,
      telegramId: BigInt(BASE_TG),
      role: 'USER',
    },
  });
  userId = user.id;
});

afterAll(async () => {
  await lyricsService.clearCatalog(userId);
  await prisma.users.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('загрузка новых сообщений', () => {
  test('одинаковый id в двух чатах — две записи, повтор не плодит дубль', async () => {
    expect(
      await lyricsService.loadNewRecords(userId, [record(CHAT_A, 500)])
    ).toBe(1);
    expect(
      await lyricsService.loadNewRecords(userId, [record(CHAT_B, 500)])
    ).toBe(1);
    expect(
      await lyricsService.loadNewRecords(userId, [
        record(CHAT_A, 500),
        record(CHAT_B, 500),
      ])
    ).toBe(0);

    expect(await lyricsService.listKnownMessageIds(userId, CHAT_A)).toEqual([
      500,
    ]);
  });

  test('заметка Apple Notes с тем же номером не считается известной для чата', async () => {
    await prisma.lyrics.create({
      data: {
        lyric_id: 777,
        source: 'APPLE_NOTES',
        date: new Date(),
        isPinned: false,
        isChannelPost: false,
        userId,
      },
    });

    const known = await lyricsService.listKnownMessageIds(userId, CHAT_A);
    expect(known).not.toContain(777);
  });

  test('разделение фразы с номером из Telegram не упирается в уникальность', async () => {
    const twoLines = record(CHAT_A, 900);
    twoLines.message.text = 'первая строка\nвторая строка';
    await lyricsService.loadNewRecords(userId, [twoLines]);

    const row = await prisma.lyrics.findFirstOrThrow({
      where: { userId, lyric_id: 900 },
      select: { id: true },
    });
    await lyricsService.splitLyric(userId, row.id, 0);

    const copies = await prisma.lyrics.findMany({
      where: { userId, lyric_id: 900 },
      select: { chatId: true },
    });
    expect(copies).toHaveLength(2);
    expect(copies.every((copy) => copy.chatId === BigInt(CHAT_A))).toBe(true);
  });
});
