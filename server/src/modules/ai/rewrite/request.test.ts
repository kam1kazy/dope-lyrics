import { describe, expect, test } from 'bun:test';

import { rankArtistCandidates } from '~/modules/ai/artists/pick';
import { buildRewriteSystem } from '~/modules/ai/rewrite/frame';
import {
  buildRewriteUser,
  collectRewriteSections,
  sectionsToText,
  stripModelWrapper,
} from '~/modules/ai/rewrite/request';
import type { CollageSlotStored } from '~/modules/lyrics/track-assemble';

const emptySlot = (songRole: CollageSlotStored['songRole']) => ({
  songRole,
  parts: [],
});

const slotsWith = (
  verse: CollageSlotStored['parts'],
  hook: CollageSlotStored['parts']
): CollageSlotStored[] => [
  emptySlot('INTRO'),
  { songRole: 'VERSE', parts: verse },
  { songRole: 'HOOK', parts: hook },
  emptySlot('VERSE'),
  emptySlot('BRIDGE'),
  { songRole: 'HOOK', parts: hook },
];

const sourceText = (
  slots: CollageSlotStored[],
  texts: ReadonlyMap<number, string>,
  hideAdlibs: boolean
): string => sectionsToText(collectRewriteSections(slots, texts, hideAdlibs));

describe('текст склейки', () => {
  const texts = new Map([
    [1, 'раз\nдва #тег\nтри\nчетыре\nпять'],
    [2, 'хук (эй)\nхук два'],
  ]);

  test('метки ролей, чистка хештегов, второй хук не дублируется', () => {
    const slots = slotsWith(
      [{ lyricId: 1, startLine: 0, endLine: 5 }],
      [{ lyricId: 2, startLine: 0, endLine: 2 }]
    );

    expect(sourceText(slots, texts, false)).toBe(
      '[Куплет]\nраз\nдва\nтри\nчетыре\n\nпять\n\n[Хук]\nхук (эй)\nхук два'
    );
  });

  test('адлибы скрываются по флагу', () => {
    const slots = slotsWith([], [{ lyricId: 2, startLine: 0, endLine: 2 }]);

    expect(sourceText(slots, texts, true)).toBe('[Хук]\nхук\nхук два');
  });

  test('пустая склейка и удалённая фраза дают пустой текст', () => {
    const slots = slotsWith([{ lyricId: 99, startLine: 0, endLine: 2 }], []);

    expect(sourceText(slots, texts, false)).toBe('');
  });
});

describe('stripModelWrapper', () => {
  test('срезает «Вот текст:»', () => {
    expect(stripModelWrapper('Вот текст:\n[Хук]\nстрока')).toBe(
      '[Хук]\nстрока'
    );
  });

  test('срезает блок кода', () => {
    expect(stripModelWrapper('```\n[Хук]\nстрока\n```')).toBe('[Хук]\nстрока');
  });

  test('срезает «Вот текст:» и блок кода вместе', () => {
    expect(stripModelWrapper('Вот текст:\n```\n[Хук]\nстрока\n```')).toBe(
      '[Хук]\nстрока'
    );
  });

  test('чистый текст не трогает', () => {
    expect(stripModelWrapper('[Хук]\nстрока')).toBe('[Хук]\nстрока');
  });
});

describe('сборка запроса', () => {
  test('тема, предпочтения и заметки не объявлены эталоном', () => {
    const bare = buildRewriteUser({
      theme: null,
      authorPrompt: '  ',
      sections: [{ label: 'Хук', text: 'х', artists: [], relaxed: false }],
    });
    expect(bare).toBe('Склейка, из которой собрать трек:\n[Хук]\nх');

    const full = buildRewriteUser({
      theme: 'бросил работу',
      authorPrompt: 'не трогай слабое',
      sections: [{ label: 'Хук', text: 'х', artists: [], relaxed: false }],
    });
    expect(full).toContain('Тема трека: бросил работу');
    expect(full).toContain('Творческие предпочтения автора');
    expect(full).toContain('Отсюда персонаж, его мир и вкус трека');
    expect(full).toContain('не трогай слабое');
    expect(full).not.toContain('Мои эталоны');
    expect(buildRewriteSystem()).not.toContain('не трогай слабое');
  });

  test('в части три приёма с подписью вида', () => {
    const { artists, relaxed } = rankArtistCandidates({
      moods: ['LONGING'],
      energies: ['QUIET'],
      deliveries: ['TUNE'],
    });

    const user = buildRewriteUser({
      theme: null,
      authorPrompt: '',
      sections: [{ label: 'Хук', text: 'х', artists, relaxed }],
    });
    const cardLines = user.split('\n').filter((line) => line.startsWith('- '));

    expect(cardLines).toHaveLength(3);
    expect(cardLines.some((line) => line.startsWith('- образ · '))).toBe(true);
    expect(cardLines.some((line) => line.startsWith('- звук · '))).toBe(true);
    expect(cardLines.some((line) => line.startsWith('- игра слов · '))).toBe(
      true
    );
    expect(user).toContain('приём на образ, на звук и на игру слов');
  });
});
