import { describe, expect, test } from 'bun:test';

import { sample } from '~/modules/ai/artists/fixtures';
import type { ScratchPick } from '~/modules/ai/scratch/pick';
import {
  buildScratchUser,
  formatScratchForm,
} from '~/modules/ai/scratch/request';

const HIT = { intro: 0, verse: 4, hook: 1, bridge: 0 };
const CANVAS = { intro: 0, verse: 8, hook: 4, bridge: 0 };

const pick: ScratchPick = {
  artistId: 1,
  artistName: 'SLAVA MARLOW',
  sample: {
    ...sample(7, { title: 'БЕЗ АТТЕСТАТА' }),
    text: 'Yeah\nЯ пропадал всю ночь\nВышел до заката',
  },
};

describe('formatScratchForm', () => {
  test('«Хит»: два куплета по 16 строк, хук и тот же хук', () => {
    expect(formatScratchForm(HIT)).toEqual([
      '[Куплет] 16 строк',
      '[Хук] 4 строки',
      '[Куплет] 16 строк',
      '[Хук] тот же хук',
    ]);
  });

  test('«Холст» и интро с бриджем', () => {
    expect(formatScratchForm({ ...CANVAS, intro: 1, bridge: 1 })).toEqual([
      '[Интро] 4 строки',
      '[Куплет] 32 строки',
      '[Хук] 16 строк',
      '[Куплет] 32 строки',
      '[Бридж] 4 строки',
      '[Хук] тот же хук',
    ]);
  });
});

describe('buildScratchUser', () => {
  test('тема, портрет, эталоны и форма', () => {
    const user = buildScratchUser({
      theme: 'пьяная Москва',
      authorPrompt: 'Dope Den, ирония',
      references: [pick],
      form: formatScratchForm(HIT),
    });

    expect(user).toContain('Тема трека: пьяная Москва');
    expect(user).toContain('Dope Den, ирония');
    expect(user).toContain('Эталон 1 · SLAVA MARLOW — «БЕЗ АТТЕСТАТА»');
    expect(user).toContain('Я пропадал всю ночь');
    expect(user).not.toContain('Yeah');
    expect(user).toContain('Форма трека:\n[Куплет] 16 строк');
    expect(user.indexOf('Эталон 1')).toBeLessThan(user.indexOf('Форма трека'));
  });

  test('без эталонов и портрета их блоков нет', () => {
    const user = buildScratchUser({
      theme: 'тема',
      authorPrompt: '  ',
      references: [],
      form: ['[Хук] 4 строки'],
    });

    expect(user).not.toContain('Эталоны');
    expect(user).not.toContain('Творческие предпочтения');
  });
});
