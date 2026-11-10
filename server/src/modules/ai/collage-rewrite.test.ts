import { describe, expect, test } from 'bun:test';

import { ARTIST_ORIENTATION } from '~/modules/ai/artist-orientation';
import {
  buildRewriteSystem,
  buildRewriteUser,
  buildSourceText,
  COLLAGE_REWRITE_FRAME,
  pickStyleExamples,
  REWRITE_JOB,
  stripModelWrapper,
} from '~/modules/ai/collage-rewrite';
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

describe('buildSourceText', () => {
  const texts = new Map([
    [1, 'раз\nдва #тег\nтри\nчетыре\nпять'],
    [2, 'хук (эй)\nхук два'],
  ]);

  test('метки ролей, чистка хештегов, второй хук не дублируется', () => {
    const slots = slotsWith(
      [{ lyricId: 1, startLine: 0, endLine: 5 }],
      [{ lyricId: 2, startLine: 0, endLine: 2 }]
    );

    expect(buildSourceText(slots, texts, false)).toBe(
      '[Куплет]\nраз\nдва\nтри\nчетыре\n\nпять\n\n[Хук]\nхук (эй)\nхук два'
    );
  });

  test('адлибы скрываются по флагу', () => {
    const slots = slotsWith([], [{ lyricId: 2, startLine: 0, endLine: 2 }]);

    expect(buildSourceText(slots, texts, true)).toBe('[Хук]\nхук\nхук два');
  });

  test('пустая склейка и удалённая фраза дают пустой текст', () => {
    const slots = slotsWith([{ lyricId: 99, startLine: 0, endLine: 2 }], []);

    expect(buildSourceText(slots, texts, false)).toBe('');
  });
});

describe('pickStyleExamples', () => {
  test('берутся только эталоны, не больше лимита, пустые выпадают', () => {
    const references = [
      '',
      ...Array.from({ length: 30 }, (_, i) => `эталон ${i}`),
    ];

    const result = pickStyleExamples(references, 25);

    expect(result).toHaveLength(25);
    expect(result[0]).toBe('эталон 0');
  });

  test('длинная фраза режется до 8 строк, хештеги чистятся', () => {
    const long = Array.from({ length: 12 }, (_, i) => `строка ${i}`).join('\n');
    const [example] = pickStyleExamples([`${long} #тег`], 4);

    expect(example?.split('\n')).toHaveLength(8);
    expect(example).not.toContain('#');
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
  test('ориентир артистов между рамкой и задачей, промпт автора его не заменяет', () => {
    expect(buildRewriteSystem('  ')).toBe(
      `${COLLAGE_REWRITE_FRAME}\n\n${ARTIST_ORIENTATION}\n\n${REWRITE_JOB}`
    );
    expect(buildRewriteSystem('жёстко')).toBe(
      `${COLLAGE_REWRITE_FRAME}\n\n${ARTIST_ORIENTATION}\n\nПромпт автора:\nжёстко\n\n${REWRITE_JOB}`
    );
  });

  test('в ориентире есть все названные артисты', () => {
    const names = [
      'Future',
      'Don Toliver',
      'Travis Scott',
      'Linkin Park',
      'Slipknot',
      'Kanye West',
      'Che Ecru',
      'Oxxxymiron',
      'Скриптонит',
      'OG Buda',
      'MAYOT',
      'Kidd',
      'STED.D',
      'ATL',
      'Markul',
      'Pharaoh',
      'Платина',
      'Rocket',
      'Boulevard Depo',
      'Loqiemean',
      'Сидоджи Дубоshit',
      'Scarlxrd',
      'Trippie Redd',
      'XXXTentacion',
      'Juice WRLD',
      'Мэйти',
    ];

    for (const name of names) {
      expect(ARTIST_ORIENTATION).toContain(name);
    }
  });

  test('тема и примеры попадают в запрос только когда есть', () => {
    const bare = buildRewriteUser({
      theme: null,
      examples: [],
      sourceText: '[Хук]\nх',
    });
    expect(bare).toBe('Склейка для правки:\n[Хук]\nх');

    const full = buildRewriteUser({
      theme: 'бросил работу',
      examples: ['a', 'b'],
      sourceText: '[Хук]\nх',
    });
    expect(full).toContain('Тема трека: бросил работу');
    expect(full).toContain('a\n---\nb');
  });
});
