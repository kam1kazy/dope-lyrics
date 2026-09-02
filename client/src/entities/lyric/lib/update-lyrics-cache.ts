import type { ApolloCache } from '@apollo/client';

import type { ShelfMode } from '@/shared/lib/lyric-view/lyric-view-context';

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
  | 'mood'
  | 'delivery'
  | 'songRole'
  | 'roleProfiles'
  | 'readiness'
>;

function lyricMatchesShelf(lyric: ILyric, shelfMode: ShelfMode): boolean {
  if (shelfMode === 'hidden') {
    return lyric.isHidden;
  }

  if (lyric.isHidden) {
    return false;
  }

  if (shelfMode === 'favorites') {
    return lyric.isFavorite;
  }

  if (shelfMode === 'references') {
    return lyric.isReference;
  }

  if (shelfMode === 'censored') {
    return lyric.isCensored;
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

function lyricMatchesFacets(
  lyric: ILyric,
  queryVariables: LyricsQueryVariables
): boolean {
  if (
    queryVariables.readiness &&
    lyric.readiness !== queryVariables.readiness
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
  queryVariables: LyricsQueryVariables,
  shelfMode: ShelfMode
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
        lyricMatchesShelf(lyric, shelfMode) &&
        lyricMatchesFacets(lyric, queryVariables)
    );

  cache.writeQuery({
    query: ALL_LYRICS,
    variables: queryVariables,
    data: { lyrics: nextLyrics },
  });
}
