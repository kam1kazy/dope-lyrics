import { describe, expect, test } from 'bun:test';

import { sample } from '~/modules/ai/artists/fixtures';
import type {
  ArtistProfile,
  ReferenceSample,
} from '~/modules/ai/artists/profiles';
import {
  hasLink,
  pickScratchReferences,
  scratchExcerpt,
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
