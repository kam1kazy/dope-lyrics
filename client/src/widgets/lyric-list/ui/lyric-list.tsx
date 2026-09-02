'use client';

import { useMemo, useRef } from 'react';

import {
  applyLyricView,
  catalogLyricsVariables,
  createCarouselList,
  LYRICS_PAGE_SIZE,
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
    shelfMode,
    selectedTags,
    selectedEmojis,
    keyword,
    dateFrom,
    dateTo,
    mood,
    delivery,
    songRole,
    readiness,
  } = useLyricView();
  const queryTags = selectedTags.length > 0 ? selectedTags : null;
  const queryEmojis = selectedEmojis.length > 0 ? selectedEmojis : null;

  const queryVariables = useMemo(
    () =>
      catalogLyricsVariables({
        tags: queryTags,
        keyword: keyword.trim() || null,
        emojis: queryEmojis,
        dateFrom: dateFrom.trim() || null,
        dateTo: dateTo.trim() || null,
        referencesOnly: shelfMode === 'references',
        favoritesOnly: shelfMode === 'favorites',
        hiddenOnly: shelfMode === 'hidden',
        censoredOnly: shelfMode === 'censored',
        oldestFirst: sortMode === 'reverse',
        mood: mood.length > 0 ? mood : null,
        delivery: delivery.length > 0 ? delivery : null,
        songRole: songRole.length > 0 ? songRole : null,
        readiness,
      }),
    [
      dateFrom,
      dateTo,
      delivery,
      keyword,
      mood,
      queryEmojis,
      queryTags,
      readiness,
      shelfMode,
      songRole,
      sortMode,
    ]
  );
  const debouncedQueryVariables = useDebouncedValue(
    queryVariables,
    FILTER_QUERY_DEBOUNCE_MS
  );

  const {
    loading,
    error,
    lyrics,
    hasMore,
    loadMore,
    queryVariables: activeQueryVariables,
  } = usePaginatedLyrics(debouncedQueryVariables);

  const carouselList = useMemo(() => {
    if (!lyrics) {
      return [];
    }

    return createCarouselList(
      applyLyricView(lyrics, {
        sortMode,
        shuffleSeed,
        pageSize: LYRICS_PAGE_SIZE,
      })
    );
  }, [lyrics, shuffleSeed, sortMode]);

  const hasFilters = hasActiveLyricFilters({
    shelfMode,
    selectedTags,
    selectedEmojis,
    keyword,
    dateFrom,
    dateTo,
    mood,
    delivery,
    songRole,
    readiness,
  });

  if (loading && !lyrics) {
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
        key={`${activeQueryVariables.hiddenOnly}-${activeQueryVariables.favoritesOnly}-${activeQueryVariables.referencesOnly}-${activeQueryVariables.censoredOnly}-${activeQueryVariables.oldestFirst}-${sortMode}-${activeQueryVariables.tags?.join('|') ?? ''}-${activeQueryVariables.emojis?.join('|') ?? ''}-${activeQueryVariables.keyword ?? ''}-${activeQueryVariables.dateFrom ?? ''}-${activeQueryVariables.dateTo ?? ''}-${activeQueryVariables.mood?.join('|') ?? ''}-${activeQueryVariables.delivery?.join('|') ?? ''}-${activeQueryVariables.songRole?.join('|') ?? ''}-${activeQueryVariables.readiness}-${shuffleSeed}`}
        data={carouselList}
        lyrics={lyrics}
        queryVariables={activeQueryVariables}
        hasMore={hasMore}
        onNeedMore={loadMore}
      />
    </div>
  );
};
