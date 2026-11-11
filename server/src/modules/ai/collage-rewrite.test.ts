import { describe, expect, test } from 'bun:test';

import { ARTIST_ORIENTATION } from '~/modules/ai/artist-orientation';
import {
  buildRewriteSystem,
  buildRewriteUser,
  buildSourceText,
  COLLAGE_REWRITE_FRAME,
  pickStyleExamples,
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
  test('в системе только правила редактора', () => {
    const system = buildRewriteSystem();

    expect(system).toBe(COLLAGE_REWRITE_FRAME);
    expect(system).toContain('готовый рэп-трек');
    expect(system).toContain(
      'Строка не остаётся только потому, что она уже написана'
    );
    expect(system).toContain('не «я люблю тебя»');
    expect(system).toContain('Герой — персонаж, не исповедь');
    expect(system).toContain('Флекс — способ думать, не список брендов');
    expect(system).toContain('Абсурд разрешён');
    expect(system).toContain('Дежурный атрибут рэпера');
    expect(system).toContain('Литературную метафору не придумывай');
    expect(system).toContain('Повтор в хуке меняет оттенок');
    expect(system).not.toContain('Чужой образ жизни не подставляй');
    expect(system).not.toContain('Новую тему не открывай');
    expect(system).not.toContain('dark trap');
    expect(system).toContain('«быть / любить»');
    expect(system).not.toContain('Каждое четверостишие держит свою мысль');
    expect(system).not.toContain('Смысл строки можно сдвинуть');
    expect(system).toContain('Буква в букву оставь звук находки');
    expect(system).toContain('Повтор буквы — протянуть и пропеть звук');
    expect(system).toContain('Заглавная внутри слова — ударение или акцент');
    expect(system).toContain('Не ставь их в каждую');
    expect(system).toContain('метки частей');
    expect(system).not.toContain('Сдержанно');
    expect(system).not.toContain('Активно');
    expect(system).not.toContain('Жёстко');
    expect(system).not.toContain('Промпт автора');
    expect(system).not.toContain(ARTIST_ORIENTATION);
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

  test('у артиста не больше пяти качеств и нет альбомов', () => {
    const lines = ARTIST_ORIENTATION.split('\n').filter((line) =>
      line.includes(' - ')
    );

    expect(lines.length).toBeGreaterThan(0);
    expect(ARTIST_ORIENTATION).not.toContain('Альбомы');

    for (const line of lines) {
      const qualities = line.split(' - ')[1]?.split(', ') ?? [];
      expect(qualities.length).toBeGreaterThan(0);
      expect(qualities.length).toBeLessThanOrEqual(5);
    }
  });

  test('тема, предпочтения и заметки не объявлены эталоном', () => {
    const bare = buildRewriteUser({
      theme: null,
      authorPrompt: '  ',
      examples: [],
      sections: [{ label: 'Хук', text: 'х', artists: [], relaxed: false }],
    });
    expect(bare).toBe('Склейка, из которой собрать трек:\n[Хук]\nх');

    const full = buildRewriteUser({
      theme: 'бросил работу',
      authorPrompt: 'не трогай слабое',
      examples: ['a', 'b'],
      sections: [{ label: 'Хук', text: 'х', artists: [], relaxed: false }],
    });
    expect(full).toContain('Тема трека: бросил работу');
    expect(full).toContain('Творческие предпочтения автора');
    expect(full).toContain('Отсюда персонаж, его мир и вкус трека');
    expect(full).toContain('не трогай слабое');
    expect(full).toContain(
      'Дополнительный авторский материал.\nИспользуй его как источник идей и образов, но не считай образцом качества или ограничением стиля:'
    );
    expect(full).toContain('a\n---\nb');
    expect(full).not.toContain('Мои эталоны');
    expect(buildRewriteSystem()).not.toContain('не трогай слабое');
  });
});
