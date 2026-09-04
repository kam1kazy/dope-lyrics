'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  type ILyricCollage,
  LYRIC_COLLAGES,
  UNLIKE_COLLAGE,
} from '@/entities/lyric';
import { useCarouselSession } from '@/shared/lib/carousel-session/carousel-session-context';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { collageToCarouselLyric } from '../lib/collage-to-carousel-lyric';
import { CatalogAssembleHistoryItem } from './catalog-assemble-history-item';

export function CatalogAssembleHistory({
  hideAdlibs,
  selectedId,
  onSelect,
  onDeleted,
  onPlay,
}: {
  hideAdlibs: boolean;
  selectedId: number | null;
  onSelect: (collage: ILyricCollage) => void;
  onDeleted: (id: number) => void;
  onPlay: () => void;
}) {
  const { loadQueue } = useCarouselSession();
  const { setPaused, suppressToggle } = usePlayback();
  const [revealedId, setRevealedId] = useState<number | null>(null);

  useEffect(() => {
    if (revealedId == null) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const node = event.target;
      if (!(node instanceof Node)) {
        setRevealedId(null);
        return;
      }

      const el = node instanceof Element ? node : node.parentElement;
      if (el?.closest('[data-assemble-history-item]')) {
        return;
      }

      setRevealedId(null);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [revealedId]);

  const { loading, error, data } = useQuery<{ lyricCollages: ILyricCollage[] }>(
    LYRIC_COLLAGES,
    { fetchPolicy: 'cache-and-network' }
  );
  const [unlikeCollage] = useMutation<
    { unlikeCollage: number },
    { id: number }
  >(UNLIKE_COLLAGE, {
    update(cache, { data: result }) {
      const removedId = result?.unlikeCollage;
      if (removedId == null) {
        return;
      }

      const existing = cache.readQuery<{ lyricCollages: ILyricCollage[] }>({
        query: LYRIC_COLLAGES,
      });
      const previous = existing?.lyricCollages ?? [];

      cache.writeQuery({
        query: LYRIC_COLLAGES,
        data: {
          lyricCollages: previous.filter((row) => row.id !== removedId),
        },
      });
    },
  });

  const history = data?.lyricCollages ?? [];

  const playCollage = (collage: ILyricCollage) => {
    const lyric = collageToCarouselLyric(collage, hideAdlibs);
    if (!lyric) {
      toast.error('Нечего запустить');
      return;
    }

    loadQueue([lyric]);
    suppressToggle();
    onPlay();
    setPaused(false);
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
        Пока нет сохранённых склеек. Соберите трек и поставьте лайк.
      </p>
    );
  }

  return (
    <div
      data-swipe-ignore
      className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-2"
    >
      {history.map((collage) => (
        <CatalogAssembleHistoryItem
          key={collage.id}
          collage={collage}
          hideAdlibs={hideAdlibs}
          selected={collage.id === selectedId}
          revealed={collage.id === revealedId}
          onSelect={() => {
            onSelect(collage);
          }}
          onRevealChange={(open) => {
            setRevealedId(open ? collage.id : null);
          }}
          onPlay={() => {
            playCollage(collage);
          }}
          onDelete={() => {
            setRevealedId((current) =>
              current === collage.id ? null : current
            );
            onDeleted(collage.id);
            void unlikeCollage({ variables: { id: collage.id } });
          }}
        />
      ))}
    </div>
  );
}
