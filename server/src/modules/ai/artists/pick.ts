import {
  ARTIST_PROFILES,
  type ArtistProfile,
} from '~/modules/ai/artists/profiles';
import {
  type ArtistTechnique,
  PICKED_KINDS,
} from '~/modules/ai/artists/techniques';
import {
  isLyricDelivery,
  isLyricEnergy,
  isLyricMood,
  roleProfilesFromJson,
} from '~/modules/lyrics/lyric-facets';

export const CANDIDATE_LIMIT = 3;
export const CANDIDATE_FLOOR = 3;

export type RankedCandidates = {
  artists: readonly ArtistProfile[];
  relaxed: boolean;
};

const overlaps = (left: readonly string[], right: readonly string[]): number =>
  right.reduce(
    (sum, item) => sum + ((left as readonly string[]).includes(item) ? 1 : 0),
    0
  );

const scoreArtist = (
  artist: ArtistProfile,
  facets: {
    moods: readonly string[];
    energies: readonly string[];
    deliveries: readonly string[];
  }
): number =>
  overlaps(artist.moods, facets.moods) * 2 +
  overlaps(artist.energies, facets.energies) +
  overlaps(artist.deliveries, facets.deliveries);

const spreadArtists = (count: number): ArtistProfile[] => {
  const picked: ArtistProfile[] = [];
  const seen = new Set<string>();

  for (const artist of ARTIST_PROFILES) {
    const key = artist.moods[0] ?? artist.id;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    picked.push(artist);
    if (picked.length === count) {
      break;
    }
  }

  return picked;
};

/** По одному приёму образа, звука и wordplay: первый у ближайшего артиста, у кого такой есть. */
const pickByKind = (
  ordered: readonly ArtistProfile[]
): readonly ArtistProfile[] => {
  const chosen = new Map<string, ArtistTechnique[]>();

  for (const kind of PICKED_KINDS) {
    for (const artist of ordered) {
      const technique = artist.techniques.find((item) => item.kind === kind);
      if (!technique) {
        continue;
      }

      chosen.set(artist.id, [...(chosen.get(artist.id) ?? []), technique]);
      break;
    }
  }

  return ordered.flatMap((artist) => {
    const techniques = chosen.get(artist.id);
    return techniques ? [{ ...artist, techniques }] : [];
  });
};

/** Несколько ближайших карточек. Пустые грани не разворачивают весь каталог. */
export const rankArtistCandidates = (facets: {
  moods: readonly string[];
  energies: readonly string[];
  deliveries: readonly string[];
}): RankedCandidates => {
  const ranked = ARTIST_PROFILES.map((artist) => ({
    artist,
    score: scoreArtist(artist, facets),
  })).sort(
    (left, right) =>
      right.score - left.score ||
      left.artist.name.localeCompare(right.artist.name, 'ru')
  );
  const positive = ranked.filter((item) => item.score > 0);

  if (positive.length === 0) {
    const spread = spreadArtists(CANDIDATE_LIMIT);
    const rest = ARTIST_PROFILES.filter((artist) => !spread.includes(artist));

    return { artists: pickByKind([...spread, ...rest]), relaxed: true };
  }

  return {
    artists: pickByKind(ranked.map((item) => item.artist)),
    relaxed: positive.length < CANDIDATE_FLOOR,
  };
};

/** Грани части для подбора: профиль роли важнее общих граней фразы. */
export const facetsForSection = (
  section: { songRole: string; lyricIds: number[] },
  rows: ReadonlyMap<
    number,
    {
      mood: string[];
      delivery: string[];
      energy: string | null;
      roleProfiles: unknown;
    }
  >
): {
  moods: string[];
  energies: string[];
  deliveries: string[];
} => {
  const moods = new Set<string>();
  const energies = new Set<string>();
  const deliveries = new Set<string>();

  for (const lyricId of section.lyricIds) {
    const row = rows.get(lyricId);
    if (!row) {
      continue;
    }

    const profile = roleProfilesFromJson(row.roleProfiles).find(
      (item) => item.songRole === section.songRole
    );
    const mood =
      profile && profile.mood.length > 0
        ? profile.mood
        : row.mood.filter(isLyricMood);
    const delivery =
      profile && profile.delivery.length > 0
        ? profile.delivery
        : row.delivery.filter(isLyricDelivery);

    for (const item of mood) {
      moods.add(item);
    }
    for (const item of delivery) {
      deliveries.add(item);
    }
    if (row.energy && isLyricEnergy(row.energy)) {
      energies.add(row.energy);
    }
  }

  return {
    moods: [...moods],
    energies: [...energies],
    deliveries: [...deliveries],
  };
};
