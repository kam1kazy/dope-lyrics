'use client';

import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { ArrowRight, Heart, ListPlus, Shuffle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  CAROUSEL_HISTORIES,
  type CarouselHistorySource,
  DELETE_CAROUSEL_HISTORY,
  type ICarouselHistory,
  type ILyric,
  LIKE_CAROUSEL_HISTORY,
  LYRICS_BY_IDS,
  UNLIKE_CAROUSEL_HISTORY,
} from '@/entities/lyric';
import { useCarouselSession } from '@/shared/lib/carousel-session/carousel-session-context';
import { formatRuDateTime } from '@/shared/lib/format-datetime';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { cn } from '@/shared/lib/utils/cn';
import { ErrorText } from '@/shared/ui/error-text';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

function SourceIcon({ source }: { source: CarouselHistorySource }) {
  if (source === 'QUEUE') {
    return (
      <ListPlus className="size-4 text-sky-400" aria-label="Своя очередь" />
    );
  }

  if (source === 'GENERATOR') {
    return (
      <Shuffle className="size-4 text-violet-400" aria-label="Генератор" />
    );
  }

  if (source === 'AI') {
    return <Shuffle className="size-4 text-amber-400" aria-label="ИИ" />;
  }

  return (
    <Shuffle className="size-4 text-muted-foreground" aria-label="Решафл" />
  );
}

function previewLines(text: string, max: number) {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .slice(0, max)
    .join('\n');
}

export function CarouselHistoryPanel({
  likedOnly,
  onPlay,
}: {
  likedOnly: boolean;
  onPlay: () => void;
}) {
  const { loadQueue } = useCarouselSession();
  const { setPaused, suppressToggle } = usePlayback();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { loading, error, data } = useQuery<{
    carouselHistories: ICarouselHistory[];
  }>(CAROUSEL_HISTORIES, { fetchPolicy: 'cache-and-network' });
  const [fetchLyrics] = useLazyQuery<{ lyricsByIds: ILyric[] }>(LYRICS_BY_IDS, {
    fetchPolicy: 'network-only',
  });
  const [likeHistory] = useMutation<
    { likeCarouselHistory: ICarouselHistory },
    { id: number }
  >(LIKE_CAROUSEL_HISTORY, {
    update(cache, { data: result }) {
      const liked = result?.likeCarouselHistory;
      if (!liked) {
        return;
      }

      const existing = cache.readQuery<{
        carouselHistories: ICarouselHistory[];
      }>({ query: CAROUSEL_HISTORIES });
      const previous = existing?.carouselHistories ?? [];

      cache.writeQuery({
        query: CAROUSEL_HISTORIES,
        data: {
          carouselHistories: previous.map((row) =>
            row.id === liked.id ? liked : row
          ),
        },
      });
    },
  });
  const [unlikeHistory] = useMutation<
    { unlikeCarouselHistory: number },
    { id: number }
  >(UNLIKE_CAROUSEL_HISTORY, {
    update(cache, { data: result }) {
      const removedId = result?.unlikeCarouselHistory;
      if (removedId == null) {
        return;
      }

      const existing = cache.readQuery<{
        carouselHistories: ICarouselHistory[];
      }>({ query: CAROUSEL_HISTORIES });
      const previous = existing?.carouselHistories ?? [];

      cache.writeQuery({
        query: CAROUSEL_HISTORIES,
        data: {
          carouselHistories: previous.filter((row) => row.id !== removedId),
        },
      });
    },
  });
  const [deleteHistory] = useMutation<
    { deleteCarouselHistory: number },
    { id: number }
  >(DELETE_CAROUSEL_HISTORY, {
    update(cache, { data: result }) {
      const removedId = result?.deleteCarouselHistory;
      if (removedId == null) {
        return;
      }

      const existing = cache.readQuery<{
        carouselHistories: ICarouselHistory[];
      }>({ query: CAROUSEL_HISTORIES });
      const previous = existing?.carouselHistories ?? [];

      cache.writeQuery({
        query: CAROUSEL_HISTORIES,
        data: {
          carouselHistories: previous.filter((row) => row.id !== removedId),
        },
      });
    },
  });

  const history = (data?.carouselHistories ?? []).filter((item) =>
    likedOnly ? item.isLiked : true
  );

  const playItem = async (item: ICarouselHistory) => {
    try {
      const result = await fetchLyrics({
        variables: { ids: item.lyricIds },
      });
      const lyrics = result.data?.lyricsByIds ?? [];

      if (lyrics.length === 0) {
        toast.error('Не удалось открыть снимок');
        return;
      }

      loadQueue(lyrics);
      suppressToggle();
      onPlay();
      setPaused(false);
    } catch {
      toast.error('Не удалось открыть снимок');
    }
  };

  if (loading && data === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorText title="Не удалось загрузить историю" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="text-muted-foreground p-4 text-sm">
        {likedOnly
          ? 'Нет сохранённых каруселей. Поставьте сердце на снимок.'
          : 'Пока нет снимков. Очистите или перемешайте карусель.'}
      </p>
    );
  }

  return (
    <div
      data-swipe-ignore
      className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2"
    >
      {history.map((item) => {
        const selected = item.id === selectedId;

        return (
          <div
            key={item.id}
            className={cn(
              'hover:bg-muted/50 flex w-full items-start gap-1 rounded-md px-2 py-2 transition-colors',
              selected && 'bg-muted'
            )}
            onClick={() => {
              setSelectedId(item.id);
            }}
            onDoubleClick={() => {
              void playItem(item);
            }}
          >
            {selected ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={
                  item.isLiked ? 'Убрать из сохранённых' : 'Сохранить'
                }
                onClick={(event) => {
                  event.stopPropagation();
                  if (item.isLiked) {
                    void unlikeHistory({ variables: { id: item.id } });
                    return;
                  }

                  void likeHistory({ variables: { id: item.id } });
                }}
              >
                <Heart
                  className={cn(
                    'size-4',
                    item.isLiked && 'fill-rose-400 text-rose-400'
                  )}
                />
              </Button>
            ) : null}
            <time className="text-muted-foreground w-[4.5rem] shrink-0 pt-1 text-[11px] leading-snug">
              {formatRuDateTime(item.createdAt)}
            </time>
            <p className="line-clamp-2 min-w-0 flex-1 pt-0.5 text-sm leading-snug whitespace-pre-wrap">
              {previewLines(item.previewText, 2) || 'Пустой снимок'}
            </p>
            <span className="mt-1 shrink-0">
              <SourceIcon source={item.source} />
            </span>
            {selected ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="Удалить"
                  onClick={(event) => {
                    event.stopPropagation();
                    void deleteHistory({ variables: { id: item.id } });
                  }}
                >
                  <Trash2 className="size-4 text-rose-400" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="Запустить в карусели"
                  onClick={(event) => {
                    event.stopPropagation();
                    void playItem(item);
                  }}
                >
                  <ArrowRight className="size-4 text-emerald-400" />
                </Button>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
