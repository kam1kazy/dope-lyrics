'use client';

import { useQuery } from '@apollo/client';
import { useRef } from 'react';

import {
  ALL_LYRICS,
  createCarouselList,
  type ILyric,
  type LyricSlide,
  TotalCount,
} from '@/entities/lyric';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { Viewport } from './viewport';

export const LyricList = () => {
  const ref = useRef<HTMLDivElement>(null);

  let carouselList: LyricSlide[] = [];

  const { loading, error, data } = useQuery<{ lyrics: ILyric[] }>(ALL_LYRICS, {
    onError: (queryError) => {
      console.error('Ошибка запроса lyrics:', queryError);
    },
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
    return <ErrorText title="Пусто" description="Список пуст" />;
  }

  if (data) {
    carouselList = createCarouselList(data.lyrics);
  } else {
    console.error('Не удалось создать список lyrics:', error);
    return <ErrorText title="Ошибка" description="Не удалось создать список" />;
  }

  return (
    <div
      ref={ref}
      className="flex h-full w-full flex-col items-center overflow-x-hidden overflow-y-auto break-keep p-4 text-center text-sm"
    >
      <h1 className="text-xl font-semibold">Dope Lyrics</h1>
      <p className="text-muted-foreground">****</p>

      <Viewport data={carouselList} />

      <TotalCount count={data.lyrics.length} />
    </div>
  );
};
