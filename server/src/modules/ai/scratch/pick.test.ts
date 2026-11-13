import { describe, expect, test } from 'bun:test';

import { sample } from '~/modules/ai/artists/fixtures';
import type {
  ArtistProfile,
  ReferenceSample,
} from '~/modules/ai/artists/profiles';
import {
  hasLink,
  pickScratchCollage,
  pickScratchReferences,
  scratchExcerpt,
  splitIntoChunks,
} from '~/modules/ai/scratch/pick';

const text = (
  id: number,
  body: string,
  tags: Partial<Omit<ReferenceSample, 'id' | 'text'>> = {}
): ReferenceSample => ({ ...sample(id, tags), text: body });

const artist = (
  id: number,
  name: string,
  texts: ReferenceSample[]
): ArtistProfile => ({
  id,
  name,
  moods: [],
  energies: [],
  deliveries: [],
  techniques: [],
  texts,
});

const BRAVADO = { moods: ['BRAVADO'], energies: [], deliveries: [] };
const NO_FACETS = { moods: [], energies: [], deliveries: [] };
const first = () => 0;

describe('scratchExcerpt', () => {
  test('срезает междометия, адлибы и метки частей в начале', () => {
    expect(
      scratchExcerpt(
        'Yeah\n(Ай-ай)\n[Intro]\nЕ-е, хм\nSpotlight, uh, moonlight, uh\nYeah\nвторая'
      )
    ).toBe('Spotlight, uh, moonlight, uh\nYeah\nвторая');
  });

  test('длинная строка из одних междометий — тоже заглушка', () => {
    expect(
      scratchExcerpt(
        'Skrrt-skrrt, skrrt-skrrt, skrrt-skrrt, skrrt-skrrt\nLawzy'
      )
    ).toBe('Lawzy');
  });

  test('режет по лимиту строк', () => {
    expect(scratchExcerpt('a1\na2\na3\na4', 2)).toBe('a1\na2');
  });

  test('строка со словами не заглушка', () => {
    expect(scratchExcerpt('Окей, погнали (ayy)\nдальше')).toBe(
      'Окей, погнали (ayy)\nдальше'
    );
  });
});

describe('hasLink', () => {
  test('звонок и сообщения — связь, остальное нет', () => {
    expect(hasLink("I've been tryna call")).toBe(true);
    expect(hasLink('бывшим не звонят')).toBe(true);
    expect(hasLink('пьяная ночь в Москве')).toBe(false);
  });
});

describe('pickScratchReferences', () => {
  const pool = [
    artist(1, 'Платина', [
      text(11, 'Бэнтли, Бенз и Бумер', { mood: ['BRAVADO'] }),
      text(12, 'Сан Ларан', { mood: ['BRAVADO'] }),
    ]),
    artist(2, 'Drake', [
      text(21, 'Emiliana, since you texted me\nCall my phone', {
        mood: ['BRAVADO'],
      }),
    ]),
    artist(3, 'MAYOT', [text(31, 'Море', { mood: ['LONGING'] })]),
    artist(4, 'Пустой', []),
  ];

  test('по граням и по одному тексту на артиста', () => {
    const picked = pickScratchReferences(pool, {
      facets: BRAVADO,
      theme: 'остаюсь тру',
      random: first,
    });

    expect(picked.map((item) => item.artistName)).toEqual(['Платина', 'MAYOT']);
  });

  test('текст со связью не берётся, если её нет в теме', () => {
    const picked = pickScratchReferences(pool, {
      facets: BRAVADO,
      theme: 'пьяная ночь',
      random: first,
    });

    expect(picked.map((item) => item.sample.id)).not.toContain(21);
  });

  test('связь в теме — текст со звонком можно', () => {
    const picked = pickScratchReferences(pool, {
      facets: BRAVADO,
      theme: 'бывшая звонит в три ночи',
      random: first,
    });

    expect(picked.map((item) => item.sample.id)).toContain(21);
  });

  test('выбранный текст идёт даже со звонком', () => {
    const picked = pickScratchReferences(pool, {
      facets: NO_FACETS,
      theme: 'пьяная ночь',
      chosenTextIds: [21],
      random: first,
    });

    expect(picked[0]?.sample.id).toBe(21);
  });

  test('два выбранных текста одного артиста идут оба', () => {
    const picked = pickScratchReferences(pool, {
      facets: NO_FACETS,
      theme: 'тема',
      chosenTextIds: [11, 12],
      random: first,
    });

    expect(picked.map((item) => item.sample.id).slice(0, 2)).toEqual([11, 12]);
    expect(picked.filter((item) => item.artistId === 1)).toHaveLength(2);
  });

  test('равные по счёту перемешиваются', () => {
    const shelf = [
      artist(1, 'A', [text(1, 'a')]),
      artist(2, 'B', [text(2, 'b')]),
      artist(3, 'C', [text(3, 'c')]),
      artist(4, 'D', [text(4, 'd')]),
    ];
    const keys = [0.9, 0.1, 0.5, 0.3];
    let call = 0;
    const picked = pickScratchReferences(shelf, {
      facets: NO_FACETS,
      theme: 'тема',
      random: () => keys[call++ % keys.length] ?? 0,
    });

    expect(picked.map((item) => item.artistName)).toEqual(['B', 'D', 'C']);
  });

  test('один текст у двух артистов идёт один раз', () => {
    const shelf = [
      artist(1, 'Pharaoh', [
        text(1, 'Эй, 5 минут назад', { mood: ['BRAVADO'] }),
      ]),
      artist(2, 'Boulevard Depo', [
        text(2, 'Эй,  5 минут назад', { mood: ['BRAVADO'] }),
      ]),
      artist(3, 'Платина', [text(3, 'Сан Ларан', { mood: ['BRAVADO'] })]),
    ];
    const picked = pickScratchReferences(shelf, {
      facets: BRAVADO,
      theme: 'тема',
      random: first,
    });

    expect(picked.map((item) => item.artistName)).toEqual([
      'Pharaoh',
      'Платина',
    ]);
  });

  test('артист без текстов не занимает место', () => {
    const picked = pickScratchReferences(pool, {
      facets: NO_FACETS,
      theme: 'тема',
      random: first,
      limit: 5,
    });

    expect(picked.map((item) => item.artistName)).not.toContain('Пустой');
  });

  test('пустая полка — пустой список', () => {
    expect(
      pickScratchReferences([], { facets: BRAVADO, theme: 'тема' })
    ).toEqual([]);
  });
});

const stanza = (tag: string, count = 4): string =>
  Array.from(
    { length: count },
    (_, index) => `${tag} строка ${index + 1}`
  ).join('\n');

const twoStanzas = (tag: string): string =>
  `${stanza(`${tag}-a`)}\n\n${stanza(`${tag}-b`)}`;

const HIT = { intro: 0, verse: 4, hook: 1, bridge: 0 };

const shelfOf = (count: number, tags = {}): ArtistProfile[] =>
  Array.from({ length: count }, (_, index) =>
    artist(index + 1, `A${index + 1}`, [
      text(index + 1, twoStanzas(`t${index + 1}`), tags),
    ])
  );

describe('splitIntoChunks', () => {
  test('абзацы по пустым строкам, длинный — по четыре, хвост к предыдущему', () => {
    const chunks = splitIntoChunks(
      `${stanza('x', 6)}\n\n${stanza('y', 2)}\n\n${stanza('z', 4)}`
    );

    expect(chunks.map((chunk) => chunk.length)).toEqual([6, 4]);
    expect(chunks[1]?.[0]).toBe('z строка 1');
  });

  test('заглушки выброшены до нарезки', () => {
    const chunks = splitIntoChunks('Yeah\n(Ай-ай)\n[Хук]\nодин\nдва\nтри');

    expect(chunks).toEqual([['один', 'два', 'три']]);
  });

  test('текст без пустых строк режется окнами по четыре', () => {
    expect(splitIntoChunks(stanza('w', 8)).map((c) => c.length)).toEqual([
      4, 4,
    ]);
  });
});

describe('pickScratchCollage', () => {
  test('«Хит»: четыре куска на куплет, один на хук, второй хук — копия', () => {
    const parts = pickScratchCollage(shelfOf(12), {
      facets: NO_FACETS,
      theme: 'тема',
      quotas: HIT,
      random: first,
    });

    expect(parts.map((part) => part.chunks.length)).toEqual([0, 4, 1, 4, 0, 1]);
    expect(parts[5]?.chunks).toEqual(parts[2]?.chunks ?? []);
  });

  test('куски части — из разных текстов, текст — один кусок на склейку', () => {
    const parts = pickScratchCollage(shelfOf(12), {
      facets: NO_FACETS,
      theme: 'тема',
      quotas: HIT,
      random: first,
    });
    const ids = parts
      .slice(0, 5)
      .flatMap((part) => part.chunks.map((c) => c.textId));

    expect(new Set(ids).size).toBe(ids.length);
  });

  test('от артиста не больше двух кусков, фильтр снимает лимит', () => {
    const many = [
      artist(
        1,
        'Платина',
        Array.from({ length: 6 }, (_, index) =>
          text(index + 1, twoStanzas(`p${index}`))
        )
      ),
    ];

    const auto = pickScratchCollage(many, {
      facets: NO_FACETS,
      theme: 'тема',
      quotas: HIT,
      random: first,
    });
    const filtered = pickScratchCollage(many, {
      facets: NO_FACETS,
      theme: 'тема',
      quotas: HIT,
      filtered: true,
      random: first,
    });
    const count = (parts: ReturnType<typeof pickScratchCollage>) =>
      parts.slice(0, 5).reduce((sum, part) => sum + part.chunks.length, 0);

    expect(count(auto)).toBe(2);
    expect(count(filtered)).toBe(9);
  });

  test('хук — из текста с ролью хука', () => {
    const shelf = [
      ...shelfOf(6),
      artist(99, 'Хукмейкер', [
        text(99, twoStanzas('hook'), { songRole: ['HOOK'] }),
      ]),
    ];
    const parts = pickScratchCollage(shelf, {
      facets: NO_FACETS,
      theme: 'тема',
      quotas: HIT,
      random: first,
    });

    expect(parts[2]?.chunks[0]?.textId).toBe(99);
  });

  test('кусок со звонком отброшен, кусок того же текста без звонка берётся', () => {
    const shelf = [
      artist(1, 'Платина', [
        text(
          1,
          'Ты ждёшь звонка\nдва\nтри\nчетыре\n\nбез связи\nдва\nтри\nчетыре',
          {
            songRole: ['HOOK'],
          }
        ),
      ]),
    ];
    const parts = pickScratchCollage(shelf, {
      facets: NO_FACETS,
      theme: 'пьяная ночь',
      quotas: { intro: 0, verse: 0, hook: 1, bridge: 0 },
      random: first,
    });

    expect(parts[2]?.chunks[0]?.lines[0]).toBe('без связи');
  });

  test('связь в теме — кусок со звонком можно', () => {
    const shelf = [
      artist(1, 'Платина', [
        text(1, 'Ты ждёшь звонка\nдва\nтри\nчетыре', { songRole: ['HOOK'] }),
      ]),
    ];
    const parts = pickScratchCollage(shelf, {
      facets: NO_FACETS,
      theme: 'бывшая звонит в три ночи',
      quotas: { intro: 0, verse: 0, hook: 1, bridge: 0 },
      random: first,
    });

    expect(parts[2]?.chunks).toHaveLength(1);
  });

  test('выбранный текст идёт и со звонком', () => {
    const shelf = [
      artist(1, 'Kidd', [text(1, 'Больше не звони\nдва\nтри\nчетыре')]),
      ...shelfOf(3).map((item) => ({ ...item, id: item.id + 10 })),
    ];
    const parts = pickScratchCollage(shelf, {
      facets: NO_FACETS,
      theme: 'тема',
      quotas: HIT,
      chosenTextIds: [1],
      filtered: true,
      random: first,
    });

    expect(
      parts.flatMap((part) => part.chunks).some((c) => c.textId === 1)
    ).toBe(true);
  });

  test('одинаковый кусок у двух артистов идёт один раз', () => {
    const shared = 'Эй, 5 минут назад\nдва\nтри\nчетыре';
    const shelf = [
      artist(1, 'Pharaoh', [text(1, shared)]),
      artist(2, 'Boulevard Depo', [text(2, shared)]),
    ];
    const parts = pickScratchCollage(shelf, {
      facets: NO_FACETS,
      theme: 'тема',
      quotas: { intro: 0, verse: 4, hook: 0, bridge: 0 },
      random: first,
    });

    expect(parts[1]?.chunks).toHaveLength(1);
  });

  test('по граням — сначала тексты с тегами темы', () => {
    const shelf = [
      ...shelfOf(6),
      artist(50, 'Понты', [text(50, twoStanzas('b'), { mood: ['BRAVADO'] })]),
    ];
    const parts = pickScratchCollage(shelf, {
      facets: BRAVADO,
      theme: 'тема',
      quotas: { intro: 0, verse: 1, hook: 0, bridge: 0 },
      random: first,
    });

    expect(parts[1]?.chunks[0]?.textId).toBe(50);
  });

  test('пустая полка — пустые части', () => {
    const parts = pickScratchCollage([], {
      facets: NO_FACETS,
      theme: 'тема',
      quotas: HIT,
    });

    expect(parts.every((part) => part.chunks.length === 0)).toBe(true);
  });
});
