'use client';

import { useLazyQuery, useMutation } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import {
  CAROUSEL_HISTORIES,
  type CarouselHistorySource,
  catalogLyricsVariables,
  type ICarouselHistory,
  LYRIC_IDS,
  SAVE_CAROUSEL_HISTORY,
} from '@/entities/lyric';
import { useCarouselSession } from '@/shared/lib/carousel-session/carousel-session-context';
import { useLyricView } from '@/shared/lib/lyric-view/lyric-view-context';

export function useSaveCarouselSnapshot() {
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
  } = useLyricView();
  const { mode, queue, prepend } = useCarouselSession();
  const queryTags = selectedTags.length > 0 ? selectedTags : null;
  const queryEmojis = selectedEmojis.length > 0 ? selectedEmojis : null;

  const filterVariables = useMemo(
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
        oldestFirst: sortMode === 'reverse',
        shuffleSeed: sortMode === 'shuffle' ? shuffleSeed : null,
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
      shuffleSeed,
      songRole,
      sortMode,
    ]
  );

  const [fetchIds] = useLazyQuery<{ lyricIds: number[] }>(LYRIC_IDS, {
    fetchPolicy: 'network-only',
  });
  const [saveHistory] = useMutation<
    { saveCarouselHistory: ICarouselHistory },
    { lyricIds: number[]; source: CarouselHistorySource }
  >(SAVE_CAROUSEL_HISTORY, {
    refetchQueries: [{ query: CAROUSEL_HISTORIES }],
  });

  const saveSnapshot = useCallback(async () => {
    try {
      let lyricIds: number[] = [];
      let source: CarouselHistorySource = 'SHUFFLE';

      if (mode === 'queue') {
        if (queue.length === 0) {
          return true;
        }

        lyricIds = queue.map((item) => item.id);
        source = 'QUEUE';
      } else {
        const result = await fetchIds({
          variables: filterVariables,
        });
        lyricIds = result.data?.lyricIds ?? [];

        if (prepend) {
          lyricIds = [
            prepend.id,
            ...lyricIds.filter((id) => id !== prepend.id),
          ];
        }

        if (lyricIds.length === 0) {
          return true;
        }

        source = 'SHUFFLE';
      }

      const saved = await saveHistory({
        variables: { lyricIds, source },
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
  }, [fetchIds, filterVariables, mode, prepend, queue, saveHistory]);

  return { saveSnapshot };
}
