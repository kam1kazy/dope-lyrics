import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { prisma } from '~/infrastructure/prisma';
import { can } from '~/modules/auth/permissions';
import { lyricsService } from '~/modules/lyrics/lyrics.service';
import { buildLyricsWhere } from '~/modules/lyrics/lyrics-list-filters';

const SUFFIX = `iso_${Date.now()}`;

let userAId = 0;
let userBId = 0;
let lyricAId = 0;
let lyricBId = 0;

beforeAll(async () => {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Users"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Users"), 1))`
  );

  const userA = await prisma.users.create({
    data: {
      username: `a_${SUFFIX}`,
      telegramId: BigInt(`900000${Date.now().toString().slice(-6)}`),
      role: 'USER',
    },
  });
  const userB = await prisma.users.create({
    data: {
      username: `b_${SUFFIX}`,
      telegramId: BigInt(`910000${Date.now().toString().slice(-6)}`),
      role: 'ADMIN',
    },
  });
  userAId = userA.id;
  userBId = userB.id;

  const lyricA = await prisma.lyrics.create({
    data: {
      lyric_id: 77_001,
      source: 'TELEGRAM',
      date: new Date(),
      isPinned: false,
      isChannelPost: false,
      userId: userAId,
      message: {
        create: {
          message_id: 77_001,
          text: `фраза A ${SUFFIX}`,
          word_count: 2,
          paragraph_count: 1,
        },
      },
    },
  });
  const lyricB = await prisma.lyrics.create({
    data: {
      lyric_id: 77_001,
      source: 'TELEGRAM',
      date: new Date(),
      isPinned: false,
      isChannelPost: false,
      userId: userBId,
      message: {
        create: {
          message_id: 77_001,
          text: `фраза B ${SUFFIX}`,
          word_count: 2,
          paragraph_count: 1,
        },
      },
    },
  });
  lyricAId = lyricA.id;
  lyricBId = lyricB.id;

  await prisma.lyricCollage.create({
    data: {
      userId: userAId,
      slots: [{ songRole: 'hook', parts: [{ lyricId: lyricAId }] }],
    },
  });
  await prisma.carouselHistory.create({
    data: {
      userId: userAId,
      source: 'SHUFFLE',
      lyricIds: [lyricAId],
      previewText: 'A',
    },
  });
});

afterAll(async () => {
  const ids = [userAId, userBId].filter((id) => id > 0);
  if (ids.length === 0) {
    await prisma.$disconnect();
    return;
  }

  await prisma.carouselHistory.deleteMany({
    where: { userId: { in: ids } },
  });
  await prisma.lyricCollage.deleteMany({
    where: { userId: { in: ids } },
  });

  const lyrics = await prisma.lyrics.findMany({
    where: { userId: { in: ids } },
    select: { id: true },
  });
  const lyricIds = lyrics.map((row) => row.id);
  if (lyricIds.length > 0) {
    await prisma.message.deleteMany({ where: { lyricId: { in: lyricIds } } });
    await prisma.lyrics.deleteMany({ where: { id: { in: lyricIds } } });
  }

  await prisma.users.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

describe('изоляция каталога', () => {
  test('автор B не видит фразы автора A в списке', async () => {
    const listB = await lyricsService.list({
      userId: userBId,
      limit: 100,
      offset: 0,
    });
    expect(listB.some((row) => row.id === lyricAId)).toBe(false);
    expect(listB.some((row) => row.id === lyricBId)).toBe(true);

    const listA = await lyricsService.list({
      userId: userAId,
      limit: 100,
      offset: 0,
    });
    expect(listA.some((row) => row.id === lyricBId)).toBe(false);
    expect(listA.some((row) => row.id === lyricAId)).toBe(true);
  });

  test('ADMIN не видит чужой каталог через where', () => {
    const where = buildLyricsWhere({
      userId: userBId,
    });
    expect(where).toMatchObject({ userId: userBId });
  });

  test('мутация автора B над записью A отклонена', async () => {
    await expect(
      lyricsService.updateLyricText(userBId, lyricAId, 'взлом')
    ).rejects.toThrow('Не найдено');

    const row = await prisma.lyrics.findUnique({
      where: { id: lyricAId },
      include: { message: true },
    });
    expect(row?.message?.text).toBe(`фраза A ${SUFFIX}`);
  });

  test('склейки и история карусели изолированы', async () => {
    const collagesB = await lyricsService.listCollages(userBId);
    const historiesB = await lyricsService.listCarouselHistories(userBId);
    expect(collagesB).toHaveLength(0);
    expect(historiesB).toHaveLength(0);

    const collagesA = await lyricsService.listCollages(userAId);
    const historiesA = await lyricsService.listCarouselHistories(userAId);
    expect(collagesA.length).toBeGreaterThanOrEqual(1);
    expect(historiesA.length).toBeGreaterThanOrEqual(1);
  });

  test('одинаковый lyric_id у разных владельцев не конфликтует', async () => {
    const a = await prisma.lyrics.findMany({
      where: { userId: userAId, lyric_id: 77_001 },
    });
    const b = await prisma.lyrics.findMany({
      where: { userId: userBId, lyric_id: 77_001 },
    });
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
  });
});

describe('роли и права (повтор матрицы)', () => {
  test('USER без db:clear; ADMIN без разрушающих', () => {
    expect(can({ role: 'USER' }, 'db:clear')).toBe(false);
    expect(can({ role: 'ADMIN' }, 'db:seed')).toBe(false);
    expect(can({ role: 'ADMIN' }, 'db:parse')).toBe(false);
    expect(can({ role: 'ADMIN' }, 'db:clear')).toBe(false);
    expect(can({ role: 'OWNER' }, 'db:clear')).toBe(true);
  });
});
