'use client';

import { useState } from 'react';

import {
  type ILyric,
  lyricMenuTitle,
  LyricsLoadMore,
  type LyricsQueryVariables,
  usePaginatedLyrics,
} from '@/entities/lyric';
import { MessageDeskDialog } from '@/features/message-desk';
import { useDebouncedValue } from '@/shared/lib/utils/use-debounced-value';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

const FILTER_QUERY_DEBOUNCE_MS = 220;

interface CatalogLyricsListProps {
  queryVariables: LyricsQueryVariables;
  emptyMessage: string;
}

export function CatalogLyricsList({
  queryVariables,
  emptyMessage,
}: CatalogLyricsListProps) {
  const [selectedLyric, setSelectedLyric] = useState<ILyric | null>(null);
  const [deskOpen, setDeskOpen] = useState(false);
  const debouncedQueryVariables = useDebouncedValue(
    queryVariables,
    FILTER_QUERY_DEBOUNCE_MS
  );
  const {
    lyrics,
    error,
    loadMore,
    hasMore,
    loading,
    loadingMore,
    queryVariables: listQueryVariables,
  } = usePaginatedLyrics(debouncedQueryVariables);

  const openLyric = (lyric: ILyric) => {
    setSelectedLyric(lyric);
    setDeskOpen(true);
  };

  if (loading && !lyrics) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error) {
    return <ErrorText title="Ошибка" />;
  }

  if (!lyrics?.length) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-1 p-3">
        {lyrics.map((lyric) => (
          <li key={lyric.id}>
            <button
              type="button"
              className="hover:bg-muted w-full rounded-md px-3 py-2 text-left transition-colors"
              onClick={() => {
                openLyric(lyric);
              }}
            >
              <span className="block truncate text-sm">
                {lyricMenuTitle(lyric.message?.text)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <LyricsLoadMore
        hasMore={hasMore}
        loadingMore={loadingMore}
        onVisible={loadMore}
      />

      <MessageDeskDialog
        lyric={selectedLyric}
        open={deskOpen}
        queryVariables={listQueryVariables}
        onOpenChange={setDeskOpen}
      />
    </>
  );
}
