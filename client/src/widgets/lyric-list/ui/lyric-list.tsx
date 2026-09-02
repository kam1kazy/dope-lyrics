'use client';

import { useMemo, useRef } from 'react';

import {
  catalogLyricsVariables,
  createCarouselList,
  usePaginatedLyrics,
} from '@/entities/lyric';
import {
  hasActiveLyricFilters,
  useLyricView,
} from '@/shared/lib/lyric-view/lyric-view-context';
import { useDebouncedValue } from '@/shared/lib/utils/use-debounced-value';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { Viewport } from './viewport';

const FILTER_QUERY_DEBOUNCE_MS = 220;

export const LyricList = () => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    sortMode,
    shuffleSeed,
    includedShelves,
    excludedShelves,
    selectedTags,
    selectedEmojis,
    keyword,
    dateFrom,
    dateTo,
    mood,
    excludeMood,
    delivery,
    excludeDelivery,
    songRole,
    excludeSongRole,
    readiness,
    excludeReadiness,
    settingsReady,
  } = useLyricView();
  const queryTags = selectedTags.length > 0 ? selectedTags : null;
  const queryEmojis = selectedEmojis.length > 0 ? selectedEmojis : null;

  const filterQueryVariables = useMemo(
    () =>
      catalogLyricsVariables({
        tags: queryTags,
        keyword: keyword.trim() || null,
        emojis: queryEmojis,
        dateFrom: dateFrom.trim() || null,
        dateTo: dateTo.trim() || null,
        includeShelves: includedShelves,
        excludeShelves: excludedShelves,
        mood: mood.length > 0 ? mood : null,
        excludeMood: excludeMood.length > 0 ? excludeMood : null,
        delivery: delivery.length > 0 ? delivery : null,
        excludeDelivery: excludeDelivery.length > 0 ? excludeDelivery : null,
        songRole: songRole.length > 0 ? songRole : null,
        excludeSongRole: excludeSongRole.length > 0 ? excludeSongRole : null,
        readiness: readiness.length > 0 ? readiness : null,
        excludeReadiness: excludeReadiness.length > 0 ? excludeReadiness : null,
      }),
    [
      dateFrom,
      dateTo,
      delivery,
      excludeDelivery,
      excludeMood,
      excludeReadiness,
      excludedShelves,
      excludeSongRole,
      includedShelves,
      keyword,
      mood,
      queryEmojis,
      queryTags,
      readiness,
      songRole,
    ]
  );
  const debouncedFilterQueryVariables = useDebouncedValue(
    filterQueryVariables,
    FILTER_QUERY_DEBOUNCE_MS
  );
  const queryVariables = useMemo(
    () => ({
      ...debouncedFilterQueryVariables,
      oldestFirst: sortMode === 'reverse',
      shuffleSeed: sortMode === 'shuffle' ? shuffleSeed : null,
    }),
    [debouncedFilterQueryVariables, shuffleSeed, sortMode]
  );

  const {
    loading,
    error,
    lyrics,
    hasMore,
    loadMore,
    queryVariables: activeQueryVariables,
  } = usePaginatedLyrics(queryVariables, {
    skip: !settingsReady,
  });

  const carouselList = useMemo(() => {
    if (!lyrics) {
      return [];
    }

    return createCarouselList(lyrics);
  }, [lyrics]);

  const hasFilters = hasActiveLyricFilters({
    includedShelves,
    excludedShelves,
    selectedTags,
    selectedEmojis,
    keyword,
    dateFrom,
    dateTo,
    mood,
    excludeMood,
    delivery,
    excludeDelivery,
    songRole,
    excludeSongRole,
    readiness,
    excludeReadiness,
  });

  if (!settingsReady || (loading && !lyrics)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error && !lyrics) {
    return <ErrorText title="Ошибка" />;
  }

  if (!lyrics?.length) {
    return (
      <ErrorText
        title="Пусто"
        description={
          hasFilters ? 'Нет текстов по выбранным фильтрам' : 'Список пуст'
        }
      />
    );
  }

  if (!carouselList.length) {
    return (
      <ErrorText
        title="Пусто"
        description="Нет текстов по выбранным фильтрам"
      />
    );
  }

  return (
    <div
      ref={ref}
      className="flex h-full min-h-0 w-full flex-col items-center overflow-hidden break-keep px-4 pt-4 text-center"
    >
      <Viewport
        key={`${activeQueryVariables.includeShelves?.join('|') ?? ''}-${activeQueryVariables.excludeShelves?.join('|') ?? ''}-${activeQueryVariables.oldestFirst}-${sortMode}-${activeQueryVariables.tags?.join('|') ?? ''}-${activeQueryVariables.emojis?.join('|') ?? ''}-${activeQueryVariables.keyword ?? ''}-${activeQueryVariables.dateFrom ?? ''}-${activeQueryVariables.dateTo ?? ''}-${activeQueryVariables.mood?.join('|') ?? ''}-${activeQueryVariables.excludeMood?.join('|') ?? ''}-${activeQueryVariables.delivery?.join('|') ?? ''}-${activeQueryVariables.excludeDelivery?.join('|') ?? ''}-${activeQueryVariables.songRole?.join('|') ?? ''}-${activeQueryVariables.excludeSongRole?.join('|') ?? ''}-${activeQueryVariables.readiness?.join('|') ?? ''}-${activeQueryVariables.excludeReadiness?.join('|') ?? ''}-${shuffleSeed}`}
        data={carouselList}
        lyrics={lyrics}
        queryVariables={activeQueryVariables}
        hasMore={hasMore}
        onNeedMore={loadMore}
      />
    </div>
  );
};
