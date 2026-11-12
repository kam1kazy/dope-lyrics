import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { prisma } from '~/infrastructure/prisma';
import {
  createArtist,
  createReferenceText,
  deleteArtist,
  getArtist,
  listArtists,
  saveReferenceTags,
  updateArtist,
  updateReferenceText,
} from '~/modules/references/references.service';

const SUFFIX = `ref_${Date.now()}`;

let userAId = 0;
let userBId = 0;

const card = (name: string, techniques = 1) => ({
  name,
  moods: ['LONGING'],
  energies: ['QUIET'],
  deliveries: ['TUNE'],
  techniques: Array.from({ length: techniques }, (_, index) => ({
    kind: 'SOUND',
    label: `приём ${index + 1}`,
    instruction: `сделай ${index + 1}`,
  })),
});

beforeAll(async () => {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Users"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Users"), 1))`
  );

  const tail = Date.now().toString().slice(-6);
  const userA = await prisma.users.create({
    data: { username: `a_${SUFFIX}`, telegramId: BigInt(`960000${tail}`) },
  });
  const userB = await prisma.users.create({
    data: { username: `b_${SUFFIX}`, telegramId: BigInt(`970000${tail}`) },
  });
  userAId = userA.id;
  userBId = userB.id;
});

afterAll(async () => {
  const ids = [userAId, userBId].filter((id) => id > 0);

  if (ids.length > 0) {
    await prisma.artist.deleteMany({ where: { userId: { in: ids } } });
    await prisma.users.deleteMany({ where: { id: { in: ids } } });
  }

  await prisma.$disconnect();
});

describe('полка эталонов', () => {
  test('новый пользователь — без стартовых карточек', async () => {
    expect(await listArtists(userAId)).toEqual([]);
  });

  test('артист: имя чистится, повтор без учёта регистра не проходит', async () => {
    const artist = await createArtist(userAId, '  Future   Hndrxx ');

    expect(artist.name).toBe('Future Hndrxx');
    await expect(createArtist(userAId, 'future hndrxx')).rejects.toThrow(
      'Такой артист уже есть'
    );
    await expect(createArtist(userAId, '   ')).rejects.toThrow(
      'Имя артиста не может быть пустым'
    );
    expect((await createArtist(userBId, 'Future Hndrxx')).name).toBe(
      'Future Hndrxx'
    );
  });

  test('чужого артиста не видно и не поменять', async () => {
    const [artist] = await listArtists(userAId);

    await expect(getArtist(userBId, artist!.id)).rejects.toThrow(
      'Артист не найден'
    );
    await expect(updateArtist(userBId, artist!.id, card('x'))).rejects.toThrow(
      'Артист не найден'
    );
    await expect(deleteArtist(userBId, artist!.id)).rejects.toThrow(
      'Артист не найден'
    );
  });

  test('карточка заменяется целиком, приёмов не больше пяти', async () => {
    const artist = await createArtist(userAId, 'MAYOT');
    const saved = await updateArtist(userAId, artist.id, card('MAYOT', 3));

    expect(saved.techniques.map((item) => item.label)).toEqual([
      'приём 1',
      'приём 2',
      'приём 3',
    ]);
    expect(saved.moods).toEqual(['LONGING']);

    const shorter = await updateArtist(userAId, artist.id, card('MAYOT', 1));
    expect(shorter.techniques).toHaveLength(1);

    await expect(
      updateArtist(userAId, artist.id, card('MAYOT', 6))
    ).rejects.toThrow('не больше 5 приёмов');
    await expect(
      updateArtist(userAId, artist.id, { ...card('MAYOT'), moods: ['SAD'] })
    ).rejects.toThrow('Неизвестное значение для поля «настроение»');
    await expect(
      updateArtist(userAId, artist.id, card('Future Hndrxx'))
    ).rejects.toThrow('Такой артист уже есть');
  });

  test('теги: ручные ставят отметку, новый текст её снимает', async () => {
    const artist = await createArtist(userAId, 'Скриптонит');
    const created = await createReferenceText(userAId, {
      artistId: artist.id,
      title: ' Вечеринка ',
      text: 'строка один\nстрока два',
    });

    expect(created.title).toBe('Вечеринка');
    expect(created.taggedAt).toBeNull();
    await expect(
      createReferenceText(userAId, { artistId: artist.id, text: '  ' })
    ).rejects.toThrow('Текст не может быть пустым');
    await expect(
      createReferenceText(userBId, { artistId: artist.id, text: 'чужой' })
    ).rejects.toThrow('Артист не найден');

    const tagged = await saveReferenceTags(userAId, created.id, {
      mood: ['COLD'],
      delivery: ['FLOW'],
      songRole: ['VERSE'],
      energy: 'EVEN',
    });
    expect(tagged.taggedAt).not.toBeNull();

    const noted = await updateReferenceText(userAId, created.id, {
      note: 'ленивый флоу',
    });
    expect(noted.note).toBe('ленивый флоу');
    expect(noted.taggedAt).not.toBeNull();

    const sameText = await updateReferenceText(userAId, created.id, {
      text: 'строка один\nстрока два',
    });
    expect(sameText.taggedAt).not.toBeNull();

    const rewritten = await updateReferenceText(userAId, created.id, {
      text: 'другой текст',
    });
    expect(rewritten.taggedAt).toBeNull();
    expect(rewritten.mood).toEqual(['COLD']);

    const manual = await updateReferenceText(userAId, created.id, {
      mood: ['IRONY'],
    });
    expect(manual.mood).toEqual(['IRONY']);
    expect(manual.taggedAt).not.toBeNull();

    const cleared = await updateReferenceText(userAId, created.id, {
      note: '   ',
    });
    expect(cleared.note).toBeNull();

    await expect(
      updateReferenceText(userBId, created.id, { note: 'чужое' })
    ).rejects.toThrow('Текст не найден');
  });

  test('удаление артиста удаляет и его тексты', async () => {
    const artist = await createArtist(userAId, 'Bladee');
    const text = await createReferenceText(userAId, {
      artistId: artist.id,
      text: 'drain',
    });

    expect(await deleteArtist(userAId, artist.id)).toBe(true);
    expect(
      await prisma.referenceText.findUnique({ where: { id: text.id } })
    ).toBeNull();
  });
});
