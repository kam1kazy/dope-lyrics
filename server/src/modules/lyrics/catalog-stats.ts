import {
  LYRIC_DELIVERIES,
  LYRIC_MOODS,
  LYRIC_READINESS,
  LYRIC_SONG_ROLES,
  type LyricDelivery,
  type LyricMood,
  type LyricReadiness,
  type LyricSongRole,
  roleProfilesFromJson,
} from '~/modules/lyrics/lyric-facets';

export type CatalogValueCount<T extends string> = {
  value: T;
  count: number;
};

export type CatalogShelfStat = {
  count: number;
  share: number;
};

export type CatalogRoleStats = {
  songRole: LyricSongRole;
  phraseCount: number;
  mood: CatalogValueCount<LyricMood>[];
  delivery: CatalogValueCount<LyricDelivery>[];
};

export type CatalogUnscopedStats = {
  phraseCount: number;
  mood: CatalogValueCount<LyricMood>[];
  delivery: CatalogValueCount<LyricDelivery>[];
};

export type CatalogStats = {
  phraseCount: number;
  references: CatalogShelfStat;
  favorites: CatalogShelfStat;
  hidden: CatalogShelfStat;
  censored: CatalogShelfStat;
  donors: CatalogShelfStat;
  withRole: CatalogShelfStat;
  roles: CatalogRoleStats[];
  unscoped: CatalogUnscopedStats;
  readiness: CatalogValueCount<LyricReadiness>[];
  readinessNone: number;
};

type CatalogStatsRow = {
  isReference: boolean;
  isFavorite: boolean;
  isHidden: boolean;
  isCensored: boolean;
  isDonor: boolean;
  songRole: string[];
  mood: string[];
  delivery: string[];
  roleProfiles: unknown;
  readiness: string | null;
};

const shareOf = (count: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }

  return count / total;
};

const shelf = (count: number, total: number): CatalogShelfStat => ({
  count,
  share: shareOf(count, total),
});

const zeroCounts = <T extends string>(
  keys: readonly T[]
): Record<T, number> => {
  const result = {} as Record<T, number>;

  for (const key of keys) {
    result[key] = 0;
  }

  return result;
};

const toValueCounts = <T extends string>(
  keys: readonly T[],
  counts: Record<T, number>
): CatalogValueCount<T>[] => {
  return keys.map((value) => ({ value, count: counts[value] }));
};

const bump = <T extends string>(
  counts: Record<T, number>,
  values: readonly string[],
  isValid: (value: string) => value is T
) => {
  const seen = new Set<T>();

  for (const raw of values) {
    if (!isValid(raw) || seen.has(raw)) {
      continue;
    }

    seen.add(raw);
    counts[raw] += 1;
  }
};

const isMood = (value: string): value is LyricMood =>
  (LYRIC_MOODS as readonly string[]).includes(value);

const isDelivery = (value: string): value is LyricDelivery =>
  (LYRIC_DELIVERIES as readonly string[]).includes(value);

const isReadiness = (value: string): value is LyricReadiness =>
  (LYRIC_READINESS as readonly string[]).includes(value);

const isSongRole = (value: string): value is LyricSongRole =>
  (LYRIC_SONG_ROLES as readonly string[]).includes(value);

export const buildCatalogStats = (rows: CatalogStatsRow[]): CatalogStats => {
  const total = rows.length;
  let references = 0;
  let favorites = 0;
  let hidden = 0;
  let censored = 0;
  let donors = 0;
  let withRole = 0;
  let unscopedPhrases = 0;
  let readinessNone = 0;

  const readinessCounts = zeroCounts(LYRIC_READINESS);
  const unscopedMood = zeroCounts(LYRIC_MOODS);
  const unscopedDelivery = zeroCounts(LYRIC_DELIVERIES);

  const rolePhrase = zeroCounts(LYRIC_SONG_ROLES);
  const roleMood: Record<LyricSongRole, Record<LyricMood, number>> = {
    VERSE: zeroCounts(LYRIC_MOODS),
    HOOK: zeroCounts(LYRIC_MOODS),
    BRIDGE: zeroCounts(LYRIC_MOODS),
    INTRO: zeroCounts(LYRIC_MOODS),
    SCENE: zeroCounts(LYRIC_MOODS),
    PUNCHLINE: zeroCounts(LYRIC_MOODS),
    SKETCH: zeroCounts(LYRIC_MOODS),
  };
  const roleDelivery: Record<LyricSongRole, Record<LyricDelivery, number>> = {
    VERSE: zeroCounts(LYRIC_DELIVERIES),
    HOOK: zeroCounts(LYRIC_DELIVERIES),
    BRIDGE: zeroCounts(LYRIC_DELIVERIES),
    INTRO: zeroCounts(LYRIC_DELIVERIES),
    SCENE: zeroCounts(LYRIC_DELIVERIES),
    PUNCHLINE: zeroCounts(LYRIC_DELIVERIES),
    SKETCH: zeroCounts(LYRIC_DELIVERIES),
  };

  for (const row of rows) {
    if (row.isReference) {
      references += 1;
    }

    if (row.isFavorite) {
      favorites += 1;
    }

    if (row.isHidden) {
      hidden += 1;
    }

    if (row.isCensored) {
      censored += 1;
    }

    if (row.isDonor) {
      donors += 1;
    }

    const roles = [
      ...new Set(row.songRole.filter(isSongRole)),
    ] as LyricSongRole[];
    const profiles = roleProfilesFromJson(row.roleProfiles);
    const profileByRole = new Map(
      profiles.map((profile) => [profile.songRole, profile])
    );

    if (roles.length > 0) {
      withRole += 1;

      for (const role of roles) {
        rolePhrase[role] += 1;
        const profile = profileByRole.get(role);
        bump(roleMood[role], profile?.mood ?? [], isMood);
        bump(roleDelivery[role], profile?.delivery ?? [], isDelivery);
      }
    } else {
      unscopedPhrases += 1;
      bump(unscopedMood, row.mood, isMood);
      bump(unscopedDelivery, row.delivery, isDelivery);
    }

    if (row.readiness && isReadiness(row.readiness)) {
      readinessCounts[row.readiness] += 1;
    } else {
      readinessNone += 1;
    }
  }

  return {
    phraseCount: total,
    references: shelf(references, total),
    favorites: shelf(favorites, total),
    hidden: shelf(hidden, total),
    censored: shelf(censored, total),
    donors: shelf(donors, total),
    withRole: shelf(withRole, total),
    roles: LYRIC_SONG_ROLES.map((songRole) => ({
      songRole,
      phraseCount: rolePhrase[songRole],
      mood: toValueCounts(LYRIC_MOODS, roleMood[songRole]),
      delivery: toValueCounts(LYRIC_DELIVERIES, roleDelivery[songRole]),
    })),
    unscoped: {
      phraseCount: unscopedPhrases,
      mood: toValueCounts(LYRIC_MOODS, unscopedMood),
      delivery: toValueCounts(LYRIC_DELIVERIES, unscopedDelivery),
    },
    readiness: toValueCounts(LYRIC_READINESS, readinessCounts),
    readinessNone,
  };
};
