import { describe, expect, test } from 'bun:test';

import { sample, TEST_SHELF } from '~/modules/ai/artists/fixtures';
import {
  assignReferenceTexts,
  rankArtistCandidates,
} from '~/modules/ai/artists/pick';
import type { ArtistProfile } from '~/modules/ai/artists/profiles';
import { PICKED_KINDS } from '~/modules/ai/artists/techniques';

const kindsOf = (artists: readonly ArtistProfile[]): string[] =>
  artists
    .flatMap((artist) => artist.techniques.map((item) => item.kind))
    .sort();

const withTexts = (
  artist: ArtistProfile,
  texts: ArtistProfile['texts']
): ArtistProfile => ({ ...artist, texts });

const facets = {
  moods: ['LONGING'],
  energies: ['QUIET'],
  deliveries: ['TUNE'],
};

describe('rankArtistCandidates', () => {
  test('по тоске и тихой подаче не отдаёт всю полку', () => {
    const { artists } = rankArtistCandidates(TEST_SHELF, facets);
    const names = artists.map((artist) => artist.name);

    expect(kindsOf(artists)).toEqual([...PICKED_KINDS].sort());
    expect(artists.length).toBeLessThanOrEqual(3);
    expect(names).toContain('MAYOT');
    expect(names).not.toContain('Slipknot');
  });

  test('без граней отдаёт несколько разных карточек', () => {
    const { artists, relaxed } = rankArtistCandidates(TEST_SHELF, {
      moods: [],
      energies: [],
      deliveries: [],
    });

    expect(relaxed).toBe(true);
    expect(kindsOf(artists)).toEqual([...PICKED_KINDS].sort());
    expect(artists).not.toHaveLength(TEST_SHELF.length);
  });

  test('берёт только переданный пул', () => {
    const pool = TEST_SHELF.filter((artist) => artist.name === 'Slipknot');
    const { artists } = rankArtistCandidates(pool, facets);

    expect(artists.map((artist) => artist.name)).toEqual(['Slipknot']);
  });

  test('пустой пул — без карточек', () => {
    expect(rankArtistCandidates([], facets).artists).toEqual([]);
  });
});

describe('assignReferenceTexts', () => {
  const [future, mayot, slipknot, oxxxy] = TEST_SHELF as [
    ArtistProfile,
    ArtistProfile,
    ArtistProfile,
    ArtistProfile,
  ];

  test('берёт текст, ближайший по тегам к части', () => {
    const artist = withTexts(future, [
      sample(10, { songRole: ['VERSE'], mood: ['COLD'] }),
      sample(11, { songRole: ['HOOK'], mood: ['LONGING'] }),
    ]);
    const { references, bySection } = assignReferenceTexts([
      { songRole: 'HOOK', facets, artists: [artist] },
    ]);

    expect(references.map((item) => item.sample.id)).toEqual([11]);
    expect(bySection[0]?.get(future.id)).toBe(1);
  });

  test('при равных тегах — первый, то есть самый новый', () => {
    const artist = withTexts(future, [sample(21), sample(20)]);
    const { references } = assignReferenceTexts([
      { songRole: 'HOOK', facets, artists: [artist] },
    ]);

    expect(references[0]?.sample.id).toBe(21);
  });

  test('один текст идёт один раз на несколько частей', () => {
    const artist = withTexts(future, [sample(30)]);
    const { references, bySection } = assignReferenceTexts([
      { songRole: 'VERSE', facets, artists: [artist] },
      { songRole: 'HOOK', facets, artists: [artist] },
    ]);

    expect(references).toHaveLength(1);
    expect(bySection[0]?.get(future.id)).toBe(1);
    expect(bySection[1]?.get(future.id)).toBe(1);
  });

  test('не больше трёх текстов, остальные артисты без текста', () => {
    const artists = [
      withTexts(future, [sample(1)]),
      withTexts(mayot, [sample(2)]),
      withTexts(slipknot, [sample(3)]),
      withTexts(oxxxy, [sample(4)]),
    ];
    const { references, bySection } = assignReferenceTexts([
      { songRole: 'VERSE', facets, artists: artists.slice(0, 2) },
      { songRole: 'HOOK', facets, artists: artists.slice(2) },
    ]);

    expect(references).toHaveLength(3);
    expect(bySection[1]?.has(oxxxy.id)).toBe(false);
  });

  test('после лимита уже выбранный текст артиста переиспользуется', () => {
    const artists = [
      withTexts(future, [sample(1)]),
      withTexts(mayot, [sample(2)]),
      withTexts(slipknot, [sample(3)]),
    ];
    const { references, bySection } = assignReferenceTexts([
      { songRole: 'VERSE', facets, artists },
      { songRole: 'HOOK', facets, artists: [artists[0]!] },
    ]);

    expect(references).toHaveLength(3);
    expect(bySection[1]?.get(future.id)).toBe(1);
  });

  test('артист без текстов — без эталона', () => {
    const { references, bySection } = assignReferenceTexts([
      { songRole: 'HOOK', facets, artists: [future] },
    ]);

    expect(references).toEqual([]);
    expect(bySection[0]?.size).toBe(0);
  });
});
