'use client';

import { useQuery } from '@apollo/client/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ALL_LYRICS } from '../api/queries';
import type { ILyric } from '../model/types';
import {
  LYRICS_PAGE_SIZE,
  type LyricsQueryVariables,
} from './lyrics-query-variables';

export function usePaginatedLyrics(
  variables: LyricsQueryVariables,
  options?: { skip?: boolean }
) {
  const skip = options?.skip === true;
  const queryVariables = useMemo(
    () => ({
      ...variables,
      limit: LYRICS_PAGE_SIZE,
      offset: 0,
    }),
    [variables]
  );
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const { loading, error, data, previousData, fetchMore } = useQuery<{
    lyrics: ILyric[];
  }>(ALL_LYRICS, {
    variables: queryVariables,
    skip,
  });

  const lyrics = skip ? undefined : (data?.lyrics ?? previousData?.lyrics);

  useEffect(() => {
    setHasMore(true);
  }, [queryVariables]);

  useEffect(() => {
    if (data?.lyrics && data.lyrics.length < LYRICS_PAGE_SIZE) {
      setHasMore(false);
    }
  }, [data?.lyrics]);

  const loadMore = useCallback(async () => {
    if (skip || loading || loadingMoreRef.current || !hasMore) {
      return;
    }

    const loaded = lyrics?.length ?? 0;

    if (loaded === 0) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      let incomingCount = 0;

      await fetchMore({
        variables: {
          ...queryVariables,
          offset: loaded,
          limit: LYRICS_PAGE_SIZE,
        },
        updateQuery: (previous, { fetchMoreResult }) => {
          incomingCount = fetchMoreResult.lyrics.length;
          const seen = new Set(previous.lyrics.map((item) => item.id));
          const appended = fetchMoreResult.lyrics.filter(
            (item) => !seen.has(item.id)
          );

          return {
            lyrics: [...previous.lyrics, ...appended],
          };
        },
      });

      setHasMore(incomingCount === LYRICS_PAGE_SIZE);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchMore, hasMore, loading, lyrics?.length, queryVariables, skip]);

  return {
    lyrics,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMore,
    queryVariables,
  };
}
