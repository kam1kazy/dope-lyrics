'use client';

import { useQuery } from '@apollo/client/react';
import { useRef } from 'react';

import { ALL_LYRICS, createCarouselList, type ILyric } from '@/entities/lyric';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { Viewport } from './viewport';

export const LyricList = () => {
  const ref = useRef<HTMLDivElement>(null);

  const { loading, error, data } = useQuery<{ lyrics: ILyric[] }>(ALL_LYRICS);

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

  const carouselList = createCarouselList(data.lyrics);

  return (
    <div
      ref={ref}
      className="flex h-full min-h-0 w-full flex-col items-center overflow-hidden break-keep px-4 pt-4 text-center"
    >
      {/* <h1 className="text-xl font-semibold">Dope Lyrics</h1> */}
      {/* <p className="text-muted-foreground">****</p> */}

      <Viewport data={carouselList} />
    </div>
  );
};
