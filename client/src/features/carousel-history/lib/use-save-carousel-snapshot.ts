'use client';

import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { toast } from 'sonner';

import {
  CAROUSEL_HISTORIES,
  type ICarouselHistory,
  SAVE_CAROUSEL_HISTORY,
} from '@/entities/lyric';
import { useCarouselSession } from '@/shared/lib/carousel-session/carousel-session-context';

export function useSaveCarouselSnapshot() {
  const { mode, queue } = useCarouselSession();
  const [saveHistory] = useMutation<
    { saveCarouselHistory: ICarouselHistory },
    { lyricIds: number[]; source: 'QUEUE' }
  >(SAVE_CAROUSEL_HISTORY, {
    refetchQueries: [{ query: CAROUSEL_HISTORIES }],
  });

  const saveSnapshot = useCallback(async () => {
    if (mode !== 'queue' || queue.length === 0) {
      return true;
    }

    if (queue.some((item) => item.id < 1)) {
      return true;
    }

    try {
      const saved = await saveHistory({
        variables: {
          lyricIds: queue.map((item) => item.id),
          source: 'QUEUE',
        },
      });

      if (saved.data?.saveCarouselHistory == null) {
        toast.error('Не удалось сохранить в историю');
        return false;
      }

      return true;
    } catch {
      toast.error('Не удалось сохранить в историю');
      return false;
    }
  }, [mode, queue, saveHistory]);

  return { saveSnapshot };
}
