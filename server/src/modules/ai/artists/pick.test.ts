import { describe, expect, test } from 'bun:test';

import { rankArtistCandidates } from '~/modules/ai/artists/pick';
import {
  ARTIST_PROFILES,
  type ArtistProfile,
} from '~/modules/ai/artists/profiles';
import { PICKED_KINDS } from '~/modules/ai/artists/techniques';

const kindsOf = (artists: readonly ArtistProfile[]): string[] =>
  artists
    .flatMap((artist) => artist.techniques.map((item) => item.kind))
    .sort();

describe('rankArtistCandidates', () => {
  test('по тоске и тихой подаче не отдаёт весь каталог', () => {
    const { artists, relaxed } = rankArtistCandidates({
      moods: ['LONGING'],
      energies: ['QUIET'],
      deliveries: ['TUNE'],
    });
    const ids = artists.map((artist) => artist.id);

    expect(relaxed).toBe(false);
    expect(kindsOf(artists)).toEqual([...PICKED_KINDS].sort());
    expect(artists.length).toBeLessThanOrEqual(3);
    expect(ids).toContain('mayot');
    expect(ids).not.toContain('slipknot');
  });

  test('без граней отдаёт несколько разных карточек', () => {
    const { artists, relaxed } = rankArtistCandidates({
      moods: [],
      energies: [],
      deliveries: [],
    });

    expect(relaxed).toBe(true);
    expect(kindsOf(artists)).toEqual([...PICKED_KINDS].sort());
    expect(artists).not.toHaveLength(ARTIST_PROFILES.length);
  });
});
