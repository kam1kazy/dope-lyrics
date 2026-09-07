'use client';

import { ListPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  type ILyric,
  lyricMenuTitle,
  LyricsLoadMore,
  type LyricsQueryVariables,
  usePaginatedLyrics,
} from '@/entities/lyric';
import { MessageDeskDialog } from '@/features/message-desk';
import { useCarouselSession } from '@/shared/lib/carousel-session/carousel-session-context';
import { cn } from '@/shared/lib/utils/cn';
import { useDebouncedValue } from '@/shared/lib/utils/use-debounced-value';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

const FILTER_QUERY_DEBOUNCE_MS = 220;

interface CatalogLyricsListProps {
  queryVariables: LyricsQueryVariables;
  emptyMessage: string;
}

function lyricDateMs(lyric: ILyric) {
  return new Date(lyric.date).getTime();
}

export function CatalogLyricsList({
  queryVariables,
  emptyMessage,
}: CatalogLyricsListProps) {
  const { mode, queue } = useCarouselSession();
  const [selectedLyric, setSelectedLyric] = useState<ILyric | null>(null);
  const [deskOpen, setDeskOpen] = useState(false);
  const [queueOnly, setQueueOnly] = useState(false);
  const debouncedQueryVariables = useDebouncedValue(
    queryVariables,
    FILTER_QUERY_DEBOUNCE_MS
  );
  const hasQueueMarks = mode === 'queue' && queue.length > 0;
  const {
    lyrics,
    error,
    loadMore,
    hasMore,
    loading,
    loadingMore,
    queryVariables: listQueryVariables,
  } = usePaginatedLyrics(debouncedQueryVariables, {
    skip: queueOnly && hasQueueMarks,
  });

  useEffect(() => {
    if (!hasQueueMarks) {
      setQueueOnly(false);
    }
  }, [hasQueueMarks]);

  const queueIds = useMemo(
    () => new Set(queue.map((lyric) => lyric.id)),
    [queue]
  );

  const queueSorted = useMemo(() => {
    const unique = new Map<number, ILyric>();

    for (const lyric of queue) {
      if (!unique.has(lyric.id)) {
        unique.set(lyric.id, lyric);
      }
    }

    return [...unique.values()].sort(
      (left, right) => lyricDateMs(right) - lyricDateMs(left)
    );
  }, [queue]);

  const openLyric = (lyric: ILyric) => {
    setSelectedLyric(lyric);
    setDeskOpen(true);
  };

  const visibleLyrics = queueOnly && hasQueueMarks ? queueSorted : lyrics;
  const deskLyric =
    visibleLyrics?.find((item) => item.id === selectedLyric?.id) ??
    selectedLyric;

  const queueFilter = hasQueueMarks ? (
    <div className="px-3 pt-3 pb-1">
      <button
        type="button"
        aria-pressed={queueOnly}
        className={cn(
          'hover:bg-muted flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
          queueOnly && 'bg-muted'
        )}
        onClick={() => {
          setQueueOnly((current) => !current);
        }}
      >
        <span>В карусели</span>
        <span
          aria-hidden
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
            queueOnly ? 'bg-sky-400' : 'bg-input'
          )}
        >
          <span
            className={cn(
              'bg-background absolute top-0.5 left-0.5 size-4 rounded-full shadow-sm transition-transform',
              queueOnly && 'translate-x-4'
            )}
          />
        </span>
      </button>
    </div>
  ) : null;

  if (queueOnly && hasQueueMarks) {
    return (
      <>
        {queueFilter}
        {queueSorted.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
            В карусели пока пусто
          </div>
        ) : (
          <ul className="flex flex-col gap-1 p-3">
            {queueSorted.map((lyric) => (
              <li key={lyric.id}>
                <LyricRow
                  lyric={lyric}
                  inQueue
                  showQueueMark
                  onOpen={openLyric}
                />
              </li>
            ))}
          </ul>
        )}

        <MessageDeskDialog
          lyric={deskLyric}
          open={deskOpen}
          queryVariables={listQueryVariables}
          onOpenChange={setDeskOpen}
          onLyricChange={setSelectedLyric}
          showQueueActions
        />
      </>
    );
  }

  return (
    <>
      {loading && !lyrics ? (
        <>
          {queueFilter}
          <div className="flex h-full items-center justify-center p-6">
            <Spinner className="size-6" />
          </div>
        </>
      ) : error ? (
        <>
          {queueFilter}
          <ErrorText title="Ошибка" />
        </>
      ) : !lyrics?.length ? (
        <>
          {queueFilter}
          <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
            {emptyMessage}
          </div>
        </>
      ) : (
        <>
          {queueFilter}
          <ul className="flex flex-col gap-1 p-3">
            {lyrics.map((lyric) => (
              <li key={lyric.id}>
                <LyricRow
                  lyric={lyric}
                  inQueue={queueIds.has(lyric.id)}
                  showQueueMark={hasQueueMarks}
                  onOpen={openLyric}
                />
              </li>
            ))}
          </ul>

          <LyricsLoadMore
            hasMore={hasMore}
            loadingMore={loadingMore}
            onVisible={loadMore}
          />
        </>
      )}

      <MessageDeskDialog
        lyric={deskLyric}
        open={deskOpen}
        queryVariables={listQueryVariables}
        onOpenChange={setDeskOpen}
        onLyricChange={setSelectedLyric}
        showQueueActions
      />
    </>
  );
}

function LyricRow({
  lyric,
  inQueue,
  showQueueMark,
  onOpen,
}: {
  lyric: ILyric;
  inQueue: boolean;
  showQueueMark: boolean;
  onOpen: (lyric: ILyric) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'hover:bg-muted flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors',
        lyric.isUsed && 'bg-amber-500/10 ring-1 ring-amber-400/30'
      )}
      onClick={() => {
        onOpen(lyric);
      }}
    >
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-sm',
          lyric.isUsed && 'text-amber-100'
        )}
      >
        {lyricMenuTitle(lyric.message?.text)}
      </span>
      {lyric.isUsed ? (
        <span className="text-[10px] font-medium tracking-wide text-amber-400 uppercase">
          исп.
        </span>
      ) : null}
      {showQueueMark && inQueue ? (
        <ListPlus
          className="size-3.5 shrink-0 text-sky-400"
          aria-label="в карусели"
        />
      ) : null}
    </button>
  );
}
