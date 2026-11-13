import { describe, expect, test } from 'bun:test';

import { sample } from '~/modules/ai/artists/fixtures';
import type {
  ArtistProfile,
  ReferenceSample,
} from '~/modules/ai/artists/profiles';
import {
  hasLink,
  pickScratchCollage,
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

describe('hasLink', () => {
  test('звонок и сообщения — связь, остальное нет', () => {
    expect(hasLink("I've been tryna call")).toBe(true);
    expect(hasLink('бывшим не звонят')).toBe(true);
    expect(hasLink('пьяная ночь в Москве')).toBe(false);
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
