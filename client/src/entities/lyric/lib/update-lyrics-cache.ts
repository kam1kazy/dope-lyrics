import type { ApolloCache } from '@apollo/client';

import {
  lyricMatchesShelves,
  SHELF_FLAGS,
  type ShelfFlag,
} from '@/shared/lib/lyric-view/shelf-filter';

import { ALL_LYRICS } from '../api/queries';
import type { ILyric } from '../model/types';
import type { LyricsQueryVariables } from './lyrics-query-variables';

type UpdatedLyric = Pick<
  ILyric,
  | 'id'
  | 'isHidden'
  | 'isFavorite'
  | 'isReference'
  | 'isCensored'
  | 'isDonor'
  | 'mood'
  | 'delivery'
  | 'songRole'
  | 'roleProfiles'
  | 'readiness'
>;

function toShelfFlags(values: string[] | null): ShelfFlag[] {
  return (values ?? []).filter((value): value is ShelfFlag =>
    (SHELF_FLAGS as readonly string[]).includes(value)
  );
}

function lyricMatchesQueryShelves(
  lyric: ILyric,
  queryVariables: LyricsQueryVariables
): boolean {
  if (
    queryVariables.includeShelves != null ||
    queryVariables.excludeShelves != null
  ) {
    return lyricMatchesShelves(lyric, {
      included: toShelfFlags(queryVariables.includeShelves),
      excluded: toShelfFlags(queryVariables.excludeShelves),
    });
  }

  if (queryVariables.hiddenOnly) {
    return lyric.isHidden;
  }

  if (lyric.isHidden) {
    return false;
  }

  if (queryVariables.censoredOnly) {
    return lyric.isCensored;
  }

  if (queryVariables.includeCensored !== true && lyric.isCensored) {
    return false;
  }

  if (queryVariables.favoritesOnly) {
    return lyric.isFavorite;
  }

  if (queryVariables.referencesOnly) {
    return lyric.isReference;
  }

  return true;
}

function roleProfileMatches(
  profile: ILyric['roleProfiles'][number],
  moods: NonNullable<LyricsQueryVariables['mood']>,
  deliveries: NonNullable<LyricsQueryVariables['delivery']>
): boolean {
  if (moods.length > 0 && !moods.some((mood) => profile.mood.includes(mood))) {
    return false;
  }

  if (
    deliveries.length > 0 &&
    !deliveries.some((delivery) => profile.delivery.includes(delivery))
  ) {
    return false;
  }

  return true;
}

function lyricHasFacetValues(
  lyric: ILyric,
  field: 'mood' | 'delivery',
  values: readonly string[]
): boolean {
  if (lyric[field].some((entry) => values.includes(entry))) {
    return true;
  }

  return (lyric.roleProfiles ?? []).some((profile) =>
    profile[field].some((entry) => values.includes(entry))
  );
}

function lyricMatchesFacets(
  lyric: ILyric,
  queryVariables: LyricsQueryVariables
): boolean {
  const includeReadiness = queryVariables.readiness ?? [];
  const excludeReadiness = queryVariables.excludeReadiness ?? [];

  if (
    includeReadiness.length > 0 &&
    (lyric.readiness == null || !includeReadiness.includes(lyric.readiness))
  ) {
    return false;
  }

  if (lyric.readiness != null && excludeReadiness.includes(lyric.readiness)) {
    return false;
  }

  const excludeMoods = queryVariables.excludeMood ?? [];
  const excludeDeliveries = queryVariables.excludeDelivery ?? [];
  const excludeRoles = queryVariables.excludeSongRole ?? [];

  if (
    excludeMoods.length > 0 &&
    lyricHasFacetValues(lyric, 'mood', excludeMoods)
  ) {
    return false;
  }

  if (
    excludeDeliveries.length > 0 &&
    lyricHasFacetValues(lyric, 'delivery', excludeDeliveries)
  ) {
    return false;
  }

  if (
    excludeRoles.length > 0 &&
    lyric.songRole.some((role) => excludeRoles.includes(role))
  ) {
    return false;
  }

  const moods = queryVariables.mood ?? [];
  const deliveries = queryVariables.delivery ?? [];
  const roles = queryVariables.songRole ?? [];

  if (moods.length === 0 && deliveries.length === 0 && roles.length === 0) {
    return true;
  }

  const profiles = lyric.roleProfiles ?? [];
  const scoped = roles.length
    ? profiles.filter((profile) => roles.includes(profile.songRole))
    : profiles;

  if (roles.length > 0) {
    return scoped.some((profile) =>
      roleProfileMatches(profile, moods, deliveries)
    );
  }

  const unscopedMood =
    moods.length === 0 || moods.some((mood) => lyric.mood.includes(mood));
  const unscopedDelivery =
    deliveries.length === 0 ||
    deliveries.some((delivery) => lyric.delivery.includes(delivery));

  if (unscopedMood && unscopedDelivery) {
    return true;
  }

  return scoped.some((profile) =>
    roleProfileMatches(profile, moods, deliveries)
  );
}

export function updateLyricsCacheAfterFlagsChange(
  cache: ApolloCache,
  updated: Partial<UpdatedLyric> & Pick<ILyric, 'id'>,
  queryVariables: LyricsQueryVariables
) {
  const existing = cache.readQuery<{ lyrics: ILyric[] }>({
    query: ALL_LYRICS,
    variables: queryVariables,
  });

  if (!existing) {
    return;
  }

  const nextLyrics = existing.lyrics
    .map((lyric) =>
      lyric.id === updated.id ? { ...lyric, ...updated } : lyric
    )
    .filter(
      (lyric) =>
        lyricMatchesQueryShelves(lyric, queryVariables) &&
        lyricMatchesFacets(lyric, queryVariables)
    );

  cache.writeQuery({
    query: ALL_LYRICS,
    variables: queryVariables,
    data: { lyrics: nextLyrics },
  });
}

function mergeLyric(current: ILyric, patch: ILyric): ILyric {
  return {
    ...current,
    ...patch,
    message:
      current.message && patch.message
        ? { ...current.message, ...patch.message }
        : (patch.message ?? current.message),
  };
}

function lyricMatchesList(lyric: ILyric, queryVariables: LyricsQueryVariables) {
  return (
    lyricMatchesQueryShelves(lyric, queryVariables) &&
    lyricMatchesFacets(lyric, queryVariables)
  );
}

export function updateLyricsCacheAfterTextChange(
  cache: ApolloCache,
  updated: ILyric,
  queryVariables: LyricsQueryVariables
) {
  const existing = cache.readQuery<{ lyrics: ILyric[] }>({
    query: ALL_LYRICS,
    variables: queryVariables,
  });

  if (!existing) {
    return;
  }

  const nextLyrics = existing.lyrics
    .map((lyric) =>
      lyric.id === updated.id ? mergeLyric(lyric, updated) : lyric
    )
    .filter((lyric) => lyricMatchesList(lyric, queryVariables));

  cache.writeQuery({
    query: ALL_LYRICS,
    variables: queryVariables,
    data: { lyrics: nextLyrics },
  });
}

export function updateLyricsCacheAfterSplit(
  cache: ApolloCache,
  top: ILyric,
  bottom: ILyric,
  queryVariables: LyricsQueryVariables
) {
  const existing = cache.readQuery<{ lyrics: ILyric[] }>({
    query: ALL_LYRICS,
    variables: queryVariables,
  });

  if (!existing) {
    return;
  }

  const nextLyrics: ILyric[] = [];

  for (const lyric of existing.lyrics) {
    if (lyric.id === top.id) {
      const mergedTop = mergeLyric(lyric, top);

      if (lyricMatchesList(mergedTop, queryVariables)) {
        nextLyrics.push(mergedTop);
      }

      if (lyricMatchesList(bottom, queryVariables)) {
        nextLyrics.push(bottom);
      }

      continue;
    }

    if (lyric.id !== bottom.id) {
      nextLyrics.push(lyric);
    }
  }

  cache.writeQuery({
    query: ALL_LYRICS,
    variables: queryVariables,
    data: { lyrics: nextLyrics },
  });
}

export function updateLyricsCacheAfterSlice(
  cache: ApolloCache,
  source: ILyric,
  created: ILyric,
  queryVariables: LyricsQueryVariables
) {
  updateLyricsCacheAfterSplit(cache, source, created, queryVariables);
}

export function prependLyricToLyricsCache(
  cache: ApolloCache,
  lyric: ILyric,
  queryVariables: LyricsQueryVariables
) {
  const existing = cache.readQuery<{ lyrics: ILyric[] }>({
    query: ALL_LYRICS,
    variables: queryVariables,
  });

  if (!existing) {
    return;
  }

  if (!lyricMatchesList(lyric, queryVariables)) {
    return;
  }

  if (existing.lyrics.some((row) => row.id === lyric.id)) {
    return;
  }

  cache.writeQuery({
    query: ALL_LYRICS,
    variables: queryVariables,
    data: { lyrics: [lyric, ...existing.lyrics] },
  });
}
