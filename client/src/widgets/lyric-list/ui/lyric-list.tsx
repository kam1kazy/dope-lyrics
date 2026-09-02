'use client';

import { useQuery } from '@apollo/client/react';
import { useMemo, useRef } from 'react';

import {
  ALL_LYRICS,
  applyLyricView,
  createCarouselList,
  type ILyric,
} from '@/entities/lyric';
import { useLyricView } from '@/shared/lib/lyric-view/lyric-view-context';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { Viewport } from './viewport';

export const LyricList = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { sortMode, shuffleSeed, selectedTags, keyword, carouselSpeed } =
    useLyricView();
  const { loading, error, data } = useQuery<{ lyrics: ILyric[] }>(ALL_LYRICS);

  const carouselList = useMemo(() => {
    if (!data?.lyrics) {
      return [];
    }

    return createCarouselList(
      applyLyricView(data.lyrics, {
        sortMode,
        shuffleSeed,
        selectedTags,
        keyword,
      })
    );
  }, [data?.lyrics, keyword, selectedTags, shuffleSeed, sortMode]);

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
    return <ErrorText title="Пусто" description="Список пуст" />;
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
        key={`${sortMode}-${shuffleSeed}-${selectedTags.join('|')}-${keyword}-${carouselSpeed}`}
        data={carouselList}
      />
    </div>
  );
};
