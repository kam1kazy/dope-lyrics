import type {
  ArtistProfile,
  ArtistTechnique,
  ReferenceSample,
} from '~/modules/ai/artists/profiles';
import { PICKED_KINDS, type PickedKind } from '~/modules/ai/artists/techniques';
import {
  isLyricDelivery,
  isLyricEnergy,
  isLyricMood,
  roleProfilesFromJson,
} from '~/modules/lyrics/lyric-facets';

export const CANDIDATE_LIMIT = 3;
export const CANDIDATE_FLOOR = 3;
/** Текстов-эталонов на один запрос. */
export const REFERENCE_TEXT_LIMIT = 3;

export type SectionFacets = {
  moods: readonly string[];
  energies: readonly string[];
  deliveries: readonly string[];
};

export type RankedCandidates = {
  artists: readonly ArtistProfile[];
  relaxed: boolean;
};

const overlaps = (left: readonly string[], right: readonly string[]): number =>
  right.reduce(
    (sum, item) => sum + ((left as readonly string[]).includes(item) ? 1 : 0),
    0
  );

const scoreArtist = (artist: ArtistProfile, facets: SectionFacets): number =>
  overlaps(artist.moods, facets.moods) * 2 +
  overlaps(artist.energies, facets.energies) +
  overlaps(artist.deliveries, facets.deliveries);

const spreadArtists = (
  artists: readonly ArtistProfile[],
  count: number
): ArtistProfile[] => {
  const picked: ArtistProfile[] = [];
  const seen = new Set<string>();

  for (const artist of artists) {
    const key = artist.moods[0] ?? `#${artist.id}`;
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

/**
 * По одному приёму каждого вида из `kinds`. Каждый вид — ещё не занятому артисту
 * из первых `near`, чтобы набралось до трёх артистов; иначе ближайшему, у кого вид есть.
 */
const pickByKind = (
  ordered: readonly ArtistProfile[],
  near: number,
  kinds: readonly PickedKind[]
): readonly ArtistProfile[] => {
  const chosen = new Map<number, ArtistTechnique[]>();

  for (const kind of kinds) {
    const options = ordered.flatMap((artist, index) => {
      const technique = artist.techniques.find((item) => item.kind === kind);
      return technique ? [{ artist, technique, index }] : [];
    });
    const option =
      options.find(
        (item) => item.index < near && !chosen.has(item.artist.id)
      ) ?? options[0];
    if (!option) {
      continue;
    }

    chosen.set(option.artist.id, [
      ...(chosen.get(option.artist.id) ?? []),
      option.technique,
    ]);
  }

  return ordered.flatMap((artist) => {
    const techniques = chosen.get(artist.id);
    return techniques ? [{ ...artist, techniques }] : [];
  });
};

/** Несколько ближайших карточек из переданной полки. Пустые грани не разворачивают всю полку. */
export const rankArtistCandidates = (
  pool: readonly ArtistProfile[],
  facets: SectionFacets,
  kinds: readonly PickedKind[] = PICKED_KINDS
): RankedCandidates => {
  const ranked = pool
    .map((artist) => ({
      artist,
      score: scoreArtist(artist, facets),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.artist.name.localeCompare(right.artist.name, 'ru')
    );
  const positive = ranked.filter((item) => item.score > 0);

  if (positive.length === 0) {
    const spread = spreadArtists(pool, CANDIDATE_LIMIT);
    const rest = pool.filter((artist) => !spread.includes(artist));

    return {
      artists: pickByKind([...spread, ...rest], spread.length, kinds),
      relaxed: true,
    };
  }

  return {
    artists: pickByKind(
      ranked.map((item) => item.artist),
      positive.length,
      kinds
    ),
    relaxed: positive.length < CANDIDATE_FLOOR,
  };
};

const scoreSample = (
  sample: ReferenceSample,
  songRole: string,
  facets: SectionFacets
): number =>
  (sample.songRole.includes(songRole) ? 2 : 0) +
  overlaps(sample.mood, facets.moods) * 2 +
  (sample.energy && facets.energies.includes(sample.energy) ? 1 : 0) +
  overlaps(sample.delivery, facets.deliveries);

/** Лучший по тегам текст; при равенстве — первый (тексты идут новые сверху). */
const bestSample = (
  samples: readonly ReferenceSample[],
  songRole: string,
  facets: SectionFacets
): ReferenceSample | null => {
  let best: ReferenceSample | null = null;
  let bestScore = -1;

  for (const sample of samples) {
    const score = scoreSample(sample, songRole, facets);
    if (score > bestScore) {
      best = sample;
      bestScore = score;
    }
  }

  return best;
};

export type PickedReference = {
  number: number;
  artistName: string;
  sample: ReferenceSample;
};

export type ReferenceAssignment = {
  references: PickedReference[];
  /** По части: id артиста → номер эталона. */
  bySection: ReadonlyMap<number, number>[];
};

/**
 * Каждому подобранному артисту части — его ближайший по тегам текст.
 * Один текст идёт один раз; после лимита новые тексты не добавляются,
 * но уже выбранный текст артиста переиспользуется.
 */
export const assignReferenceTexts = (
  sections: readonly {
    songRole: string;
    facets: SectionFacets;
    artists: readonly ArtistProfile[];
  }[],
  limit = REFERENCE_TEXT_LIMIT
): ReferenceAssignment => {
  const references: PickedReference[] = [];
  const numberById = new Map<number, number>();

  const bySection = sections.map((section) => {
    const numbers = new Map<number, number>();

    for (const artist of section.artists) {
      const available =
        references.length < limit
          ? artist.texts
          : artist.texts.filter((sample) => numberById.has(sample.id));
      const sample = bestSample(available, section.songRole, section.facets);
      if (!sample) {
        continue;
      }

      let number = numberById.get(sample.id);
      if (number === undefined) {
        number = references.length + 1;
        numberById.set(sample.id, number);
        references.push({ number, artistName: artist.name, sample });
      }

      numbers.set(artist.id, number);
    }

    return numbers;
  });

  return { references, bySection };
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
