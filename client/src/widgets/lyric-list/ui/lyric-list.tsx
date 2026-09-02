'use client';

import { useQuery } from '@apollo/client/react';
import { useDeferredValue, useMemo, useRef } from 'react';

import {
  ALL_LYRICS,
  applyLyricView,
  createCarouselList,
  type ILyric,
} from '@/entities/lyric';
import {
  hasActiveLyricFilters,
  useLyricView,
} from '@/shared/lib/lyric-view/lyric-view-context';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { Viewport } from './viewport';

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
  } = useLyricView();
  const deferredKeyword = useDeferredValue(keyword.trim());
  const queryTags = selectedTags.length > 0 ? selectedTags : null;
  const queryEmojis = selectedEmojis.length > 0 ? selectedEmojis : null;

  const queryVariables = {
    tags: queryTags,
    keyword: deferredKeyword || null,
    emojis: queryEmojis,
    dateFrom: dateFrom.trim() || null,
    dateTo: dateTo.trim() || null,
    referencesOnly: shelfMode === 'references',
    favoritesOnly: shelfMode === 'favorites',
    hiddenOnly: shelfMode === 'hidden',
  };

  const { loading, error, data } = useQuery<{ lyrics: ILyric[] }>(ALL_LYRICS, {
    variables: queryVariables,
  });

  const carouselList = useMemo(() => {
    if (!data?.lyrics) {
      return [];
    }

    return createCarouselList(
      applyLyricView(data.lyrics, {
        sortMode,
        shuffleSeed,
      })
    );
  }, [data?.lyrics, shuffleSeed, sortMode]);

  const hasFilters = hasActiveLyricFilters({
    shelfMode,
    selectedTags,
    selectedEmojis,
    keyword: deferredKeyword,
    dateFrom,
    dateTo,
  });

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return <ErrorText title="Ошибка" />;
  }

  if (!data?.lyrics?.length) {
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
        key={`${sortMode}-${shuffleSeed}-${shelfMode}-${selectedTags.join('|')}-${selectedEmojis.join('|')}-${deferredKeyword}-${dateFrom}-${dateTo}`}
        data={carouselList}
        lyrics={data.lyrics}
        queryVariables={queryVariables}
      />
    </div>
  );
};
