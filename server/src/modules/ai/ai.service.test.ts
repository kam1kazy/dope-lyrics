import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { prisma } from '~/infrastructure/prisma';
import { loadStyleExamples } from '~/modules/ai/ai.service';

const SUFFIX = `ai_${Date.now()}`;

let userAId = 0;
let userBId = 0;
let slotLyricId = 0;

const createLyric = async (
  userId: number,
  text: string,
  extra: { isReference?: boolean } = {}
) => {
  const messageId = Math.floor(Math.random() * 1_000_000) + 1;
  const row = await prisma.lyrics.create({
    data: {
      lyric_id: messageId,
      source: 'TELEGRAM',
      date: new Date(),
      isPinned: false,
      isChannelPost: false,
      isReference: extra.isReference ?? false,
      userId,
      message: {
        create: {
          message_id: messageId,
          text,
          word_count: 2,
          paragraph_count: 1,
        },
      },
    },
  });

  return row.id;
};

beforeAll(async () => {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Users"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Users"), 1))`
  );

  const userA = await prisma.users.create({
    data: {
      username: `a_${SUFFIX}`,
      telegramId: BigInt(`920000${Date.now().toString().slice(-6)}`),
      role: 'OWNER',
    },
  });
  const userB = await prisma.users.create({
    data: {
      username: `b_${SUFFIX}`,
      telegramId: BigInt(`930000${Date.now().toString().slice(-6)}`),
      role: 'OWNER',
    },
  });
  userAId = userA.id;
  userBId = userB.id;

  slotLyricId = await createLyric(userAId, `в склейке ${SUFFIX}`);
  await createLyric(userAId, `эталон ${SUFFIX}`, { isReference: true });
  await createLyric(userAId, `обычная ${SUFFIX}`);
  await createLyric(userBId, `чужая ${SUFFIX}`);
  await createLyric(userBId, `чужой эталон ${SUFFIX}`, { isReference: true });
});

afterAll(async () => {
  const ids = [userAId, userBId].filter((id) => id > 0);

  if (ids.length > 0) {
    const lyrics = await prisma.lyrics.findMany({
      where: { userId: { in: ids } },
      select: { id: true },
    });
    const lyricIds = lyrics.map((row) => row.id);
    await prisma.message.deleteMany({ where: { lyricId: { in: lyricIds } } });
    await prisma.lyrics.deleteMany({ where: { id: { in: lyricIds } } });
    await prisma.users.deleteMany({ where: { id: { in: ids } } });
  }

  await prisma.$disconnect();
});

describe('примеры стиля для ИИ', () => {
  test('только свои эталоны, обычные фразы и чужой каталог не попадают', async () => {
    const examples = await loadStyleExamples(userAId, [slotLyricId]);

    expect(examples).toEqual([`эталон ${SUFFIX}`]);
  });
});
