import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { prisma } from '~/infrastructure/prisma';
import {
  createTrackText,
  getTrackText,
  listTrackTexts,
  markTrackTextDone,
  updateTrackText,
} from '~/modules/track-texts/track-texts.service';

const SUFFIX = `tt_${Date.now()}`;

let userAId = 0;
let userBId = 0;
let lyricId = 0;
let textId = 0;

const slotsFor = (id: number) => [
  { songRole: 'INTRO', parts: [] },
  { songRole: 'VERSE', parts: [{ lyricId: id, startLine: 0, endLine: 2 }] },
  { songRole: 'HOOK', parts: [] },
  { songRole: 'VERSE', parts: [] },
  { songRole: 'BRIDGE', parts: [] },
  { songRole: 'HOOK', parts: [] },
];

beforeAll(async () => {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Users"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Users"), 1))`
  );

  const userA = await prisma.users.create({
    data: {
      username: `a_${SUFFIX}`,
      telegramId: BigInt(`940000${Date.now().toString().slice(-6)}`),
      role: 'OWNER',
    },
  });
  const userB = await prisma.users.create({
    data: {
      username: `b_${SUFFIX}`,
      telegramId: BigInt(`950000${Date.now().toString().slice(-6)}`),
      role: 'OWNER',
    },
  });
  userAId = userA.id;
  userBId = userB.id;

  const lyric = await prisma.lyrics.create({
    data: {
      lyric_id: 88_001,
      source: 'TELEGRAM',
      date: new Date(),
      isPinned: false,
      isChannelPost: false,
      userId: userAId,
      message: {
        create: {
          message_id: 88_001,
          text: 'первая строка\nвторая строка',
          word_count: 4,
          paragraph_count: 1,
        },
      },
    },
  });
  lyricId = lyric.id;
});

afterAll(async () => {
  const ids = [userAId, userBId].filter((id) => id > 0);

  if (ids.length > 0) {
    await prisma.trackText.deleteMany({ where: { userId: { in: ids } } });
    await prisma.message.deleteMany({ where: { lyricId } });
    await prisma.lyrics.deleteMany({ where: { id: lyricId } });
    await prisma.users.deleteMany({ where: { id: { in: ids } } });
  }

  await prisma.$disconnect();
});

describe('тексты из генератора', () => {
  test('сохранение: снимок «Из моих» собирает сервер, рабочая версия = ответ ИИ', async () => {
    const created = await createTrackText(userAId, {
      slots: slotsFor(lyricId),
      theme: '  бросил работу ',
      aiText: '[Куплет]\nпереписано',
    });
    textId = created.id;

    expect(created.sourceText).toBe('[Куплет]\nпервая строка\nвторая строка');
    expect(created.aiText).toBe('[Куплет]\nпереписано');
    expect(created.text).toBe(created.aiText);
    expect(created.theme).toBe('бросил работу');
    expect(created.finalText).toBeNull();
  });

  test('правка меняет рабочую версию, снимки остаются', async () => {
    const updated = await updateTrackText(userAId, textId, 'моя правка');

    expect(updated.text).toBe('моя правка');
    expect(updated.aiText).toBe('[Куплет]\nпереписано');
    expect(updated.sourceText).toContain('первая строка');
  });

  test('«Готово» фиксирует финал, правка после него финал не трогает', async () => {
    const done = await markTrackTextDone(userAId, textId);
    expect(done.finalText).toBe('моя правка');
    expect(done.doneAt).not.toBeNull();

    const edited = await updateTrackText(userAId, textId, 'ещё правка');
    expect(edited.finalText).toBe('моя правка');

    const again = await markTrackTextDone(userAId, textId);
    expect(again.finalText).toBe('ещё правка');
  });

  test('чужой текст не читается и не правится', async () => {
    expect(await listTrackTexts(userBId)).toHaveLength(0);
    await expect(getTrackText(userBId, textId)).rejects.toThrow();
    await expect(updateTrackText(userBId, textId, 'взлом')).rejects.toThrow();
    await expect(markTrackTextDone(userBId, textId)).rejects.toThrow();
  });

  test('чужая фраза в слотах не попадает в снимок', async () => {
    await expect(
      createTrackText(userBId, {
        slots: slotsFor(lyricId),
        aiText: 'текст',
      })
    ).rejects.toThrow('В склейке нет строк');
  });
});
