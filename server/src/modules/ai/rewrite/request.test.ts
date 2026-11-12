import { describe, expect, test } from 'bun:test';

import { sample, TEST_SHELF } from '~/modules/ai/artists/fixtures';
import {
  assignReferenceTexts,
  rankArtistCandidates,
} from '~/modules/ai/artists/pick';
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
    const { artists } = rankArtistCandidates(TEST_SHELF, {
      moods: ['LONGING'],
      energies: ['QUIET'],
      deliveries: ['TUNE'],
    });

    const user = buildRewriteUser({
      theme: null,
      authorPrompt: '',
      sections: [{ label: 'Хук', text: 'х', artists, relaxed: false }],
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

describe('эталоны в запросе', () => {
  const future = {
    ...TEST_SHELF[0]!,
    texts: [
      {
        ...sample(7, { title: 'Mask Off', note: 'холодная тяга без нытья' }),
        text: Array.from({ length: 30 }, (_, i) => `строка ${i + 1}`).join(
          '\n'
        ),
      },
    ],
  };

  test('блок эталона с пояснением, подпись у артиста, обрезка по строкам', () => {
    const { references, bySection } = assignReferenceTexts([
      {
        songRole: 'HOOK',
        facets: { moods: [], energies: [], deliveries: [] },
        artists: [future],
      },
    ]);
    const user = buildRewriteUser({
      theme: null,
      authorPrompt: '',
      sections: [
        {
          label: 'Хук',
          text: 'х',
          artists: [future],
          relaxed: false,
          referenceNumbers: bySection[0],
        },
      ],
      references,
    });

    expect(user).toContain('Эталон 1 · Future — «Mask Off»');
    expect(user).toContain('Чем нравится автору: холодная тяга без нытья');
    expect(user).toContain('Future · эталон 1');
    expect(user).toContain('строка 24\n…');
    expect(user).not.toContain('строка 25');
    expect(user.indexOf('Эталоны —')).toBeLessThan(user.indexOf('Склейка'));
    expect(buildRewriteSystem()).not.toContain('Mask Off');
  });

  test('без эталонов блока нет', () => {
    const user = buildRewriteUser({
      theme: null,
      authorPrompt: '',
      sections: [{ label: 'Хук', text: 'х', artists: [], relaxed: false }],
      references: [],
    });

    expect(user).not.toContain('Эталоны');
  });

  test('приём подписан ярлыком', () => {
    const user = buildRewriteUser({
      theme: null,
      authorPrompt: '',
      sections: [
        { label: 'Хук', text: 'х', artists: [TEST_SHELF[0]!], relaxed: false },
      ],
    });

    expect(user).toContain(
      '- звук · автотюн как чувство: инструкция: автотюн как чувство'
    );
  });
});
