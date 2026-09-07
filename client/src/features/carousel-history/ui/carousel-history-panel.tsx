'use client';

import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  CAROUSEL_HISTORIES,
  DELETE_CAROUSEL_HISTORY,
  type ICarouselHistory,
  type ILyric,
  LIKE_CAROUSEL_HISTORY,
  LYRICS_BY_IDS,
  UNLIKE_CAROUSEL_HISTORY,
} from '@/entities/lyric';
import { useCarouselSession } from '@/shared/lib/carousel-session/carousel-session-context';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { CarouselHistoryItem } from './carousel-history-item';

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
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<number>>(
    () => new Set()
  );
  const [revealedId, setRevealedId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedId == null && revealedId == null) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const node = event.target;
      if (!(node instanceof Node)) {
        setSelectedId(null);
        setRevealedId(null);
        return;
      }

      const el = node instanceof Element ? node : node.parentElement;
      if (el?.closest('[data-history-item]')) {
        return;
      }

      setSelectedId(null);
      setRevealedId(null);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [revealedId, selectedId]);

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

  const removeItem = (id: number) => {
    setSelectedId((current) => (current === id ? null : current));
    setRevealedId((current) => (current === id ? null : current));
    setExpandedIds((current) => {
      if (!current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.delete(id);
      return next;
    });
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
        <ErrorText title="Не удалось загрузить историю" error={error} />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="text-muted-foreground p-4 text-sm">
        {likedOnly
          ? 'Нет сохранённых каруселей. Поставьте сердце на снимок.'
          : 'Пока нет снимков. Соберите карусель и нажмите «Очистить».'}
      </p>
    );
  }

  return (
    <div
      data-swipe-ignore
      className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-2"
    >
      {history.map((item) => (
        <CarouselHistoryItem
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          expanded={expandedIds.has(item.id)}
          revealed={item.id === revealedId}
          onSelect={() => {
            setSelectedId(item.id);
          }}
          onToggleExpand={() => {
            setExpandedIds((current) => {
              const next = new Set(current);
              if (next.has(item.id)) {
                next.delete(item.id);
              } else {
                next.add(item.id);
              }

              return next;
            });
          }}
          onRevealChange={(open) => {
            setRevealedId(open ? item.id : null);
          }}
          onPlay={() => {
            void playItem(item);
          }}
          onLike={() => {
            void likeHistory({ variables: { id: item.id } });
          }}
          onUnlike={() => {
            removeItem(item.id);
            void unlikeHistory({ variables: { id: item.id } });
          }}
          onDelete={() => {
            removeItem(item.id);
            void deleteHistory({ variables: { id: item.id } });
          }}
        />
      ))}
    </div>
  );
}
