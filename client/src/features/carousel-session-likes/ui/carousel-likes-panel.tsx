'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { HeartOff, History } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  CAROUSEL_HISTORIES,
  catalogLyricsVariables,
  type ICarouselHistory,
  type ILyric,
  LYRICS_BY_IDS,
  SAVE_CAROUSEL_HISTORY,
} from '@/entities/lyric';
import { MessageDeskDialog } from '@/features/message-desk';
import { useCarouselSession } from '@/shared/lib/carousel-session/carousel-session-context';
import { useLyricView } from '@/shared/lib/lyric-view/lyric-view-context';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/ui/dialog';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/shadcn/ui/tooltip';

type CarouselLikesPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CarouselLikesPanel({
  open,
  onOpenChange,
}: CarouselLikesPanelProps) {
  const { likedLines, likedLyricIds, removeLike, clearLikes } =
    useCarouselSession();
  const { beginOverlay, endOverlay, suppressToggle, setPaused } = usePlayback();
  const {
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
    energy,
    excludeEnergy,
    sortMode,
    shuffleSeed,
  } = useLyricView();
  const [deskLyric, setDeskLyric] = useState<ILyric | null>(null);
  const [deskOpen, setDeskOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const queryVariables = useMemo(
    () => ({
      ...catalogLyricsVariables({
        tags: selectedTags.length > 0 ? selectedTags : null,
        keyword: keyword.trim() || null,
        emojis: selectedEmojis.length > 0 ? selectedEmojis : null,
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
        energy: energy.length > 0 ? energy : null,
        excludeEnergy: excludeEnergy.length > 0 ? excludeEnergy : null,
      }),
      oldestFirst: sortMode === 'reverse',
      shuffleSeed: sortMode === 'shuffle' ? shuffleSeed : null,
    }),
    [
      dateFrom,
      dateTo,
      delivery,
      energy,
      excludeDelivery,
      excludeEnergy,
      excludeMood,
      excludeReadiness,
      excludedShelves,
      excludeSongRole,
      includedShelves,
      keyword,
      mood,
      readiness,
      selectedEmojis,
      selectedTags,
      shuffleSeed,
      songRole,
      sortMode,
    ]
  );

  const { data, loading, refetch } = useQuery<{ lyricsByIds: ILyric[] }>(
    LYRICS_BY_IDS,
    {
      variables: { ids: likedLyricIds },
      skip: !open || likedLyricIds.length === 0,
      fetchPolicy: 'cache-and-network',
    }
  );

  const lyricsById = useMemo(() => {
    const map = new Map<number, ILyric>();
    for (const lyric of data?.lyricsByIds ?? []) {
      map.set(lyric.id, lyric);
    }
    if (deskLyric) {
      map.set(deskLyric.id, deskLyric);
    }
    return map;
  }, [data?.lyricsByIds, deskLyric]);

  const [saveHistory] = useMutation<
    { saveCarouselHistory: ICarouselHistory },
    { lyricIds: number[]; source: 'SHUFFLE' }
  >(SAVE_CAROUSEL_HISTORY, {
    refetchQueries: [{ query: CAROUSEL_HISTORIES }],
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    beginOverlay();
    setPaused(true);
    return () => {
      endOverlay();
    };
  }, [beginOverlay, endOverlay, open, setPaused]);

  useEffect(() => {
    if (open && likedLyricIds.length > 0) {
      void refetch();
    }
  }, [likedLyricIds, open, refetch]);

  const openDesk = (lyricId: number) => {
    const live = lyricsById.get(lyricId);
    if (!live) {
      toast.error('Не удалось открыть фразу');
      return;
    }

    suppressToggle();
    setDeskLyric(live);
    setDeskOpen(true);
  };

  const saveToHistory = async () => {
    if (likedLyricIds.length === 0) {
      return;
    }

    setBusy(true);

    try {
      const saved = await saveHistory({
        variables: {
          lyricIds: likedLyricIds,
          source: 'SHUFFLE',
        },
      });

      if (saved.data?.saveCarouselHistory == null) {
        toast.error('Не удалось сохранить в историю');
        return;
      }

      clearLikes();
      toast.success('Сохранено в историю');
      onOpenChange(false);
    } catch {
      toast.error('Не удалось сохранить в историю');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[min(80vh,40rem)] flex-col gap-3 sm:max-w-md"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Лайкнутые</DialogTitle>
          </DialogHeader>

          {likedLines.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              Лайков пока нет. Свайпните строку влево на карусели.
            </div>
          ) : loading && !data ? (
            <div className="flex justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {likedLines.map((entry, index) => {
                const lyric = lyricsById.get(entry.lyricId);
                const prev = index > 0 ? likedLines[index - 1] : null;
                const newMessage =
                  prev != null && prev.lyricId !== entry.lyricId;

                return (
                  <li
                    key={entry.key}
                    className={
                      newMessage
                        ? 'border-border flex cursor-default items-center gap-2 border-t px-1 py-2'
                        : 'flex cursor-default items-center gap-2 px-1 py-2'
                    }
                    onDoubleClick={() => {
                      if (!lyric || busy) {
                        return;
                      }

                      openDesk(entry.lyricId);
                    }}
                  >
                    <p
                      className="min-w-0 flex-1 truncate text-sm"
                      title={entry.text}
                    >
                      {entry.text}
                    </p>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 shrink-0"
                      disabled={busy}
                      aria-label="Снять лайк"
                      title="Снять лайк"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeLike(entry.key);
                      }}
                    >
                      <HeartOff className="size-4 text-rose-400" aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  className="gap-2"
                  disabled={busy || likedLyricIds.length === 0}
                  onClick={() => {
                    void saveToHistory();
                  }}
                >
                  <History className="size-4" aria-hidden />В историю
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-56 text-pretty">
                Сохранить сообщения этих строк снимком в историю карусели и
                очистить список лайков
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy || likedLines.length === 0}
                  onClick={() => {
                    clearLikes();
                  }}
                >
                  Очистить
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-56 text-pretty">
                Снять все лайки сессии, не сохраняя в историю
              </TooltipContent>
            </Tooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MessageDeskDialog
        lyric={deskLyric}
        open={deskOpen}
        queryVariables={queryVariables}
        onOpenChange={(next) => {
          setDeskOpen(next);
          if (!next) {
            setDeskLyric(null);
          }
        }}
        onLyricChange={(next) => {
          setDeskLyric(next);
          void refetch();
        }}
      />
    </>
  );
}
