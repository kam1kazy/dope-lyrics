import type { ApolloCache } from '@apollo/client';

import type { ShelfMode } from '@/shared/lib/lyric-view/lyric-view-context';

import { ALL_LYRICS } from '../api/queries';
import type { ILyric } from '../model/types';
import type { LyricsQueryVariables } from './lyrics-query-variables';

type UpdatedFlags = Pick<
  ILyric,
  'id' | 'isHidden' | 'isFavorite' | 'isReference'
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

  return true;
}

export function updateLyricsCacheAfterFlagsChange(
  cache: ApolloCache,
  updated: UpdatedFlags,
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
    .filter((lyric) => lyricMatchesShelf(lyric, shelfMode));

  cache.writeQuery({
    query: ALL_LYRICS,
    variables: queryVariables,
    data: { lyrics: nextLyrics },
  });
}
