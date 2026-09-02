'use client';

import { useQuery } from '@apollo/client/react';
import { ChevronLeft } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ALL_LYRICS,
  formatDemoName,
  type ILyric,
  type ILyricDemo,
  LYRIC_DEMOS,
  previewLyricText,
} from '@/entities/lyric';
import { MessageDeskDialog } from '@/features/message-desk';
import { cn } from '@/shared/lib/utils/cn';
import { ErrorText } from '@/shared/ui/error-text';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

interface CatalogDemosPanelProps {
  selectedDemo: string | null;
  onSelectDemo: (name: string | null) => void;
}

export function CatalogDemosPanel({
  selectedDemo,
  onSelectDemo,
}: CatalogDemosPanelProps) {
  const [selectedLyric, setSelectedLyric] = useState<ILyric | null>(null);
  const [deskOpen, setDeskOpen] = useState(false);

  const {
    loading: demosLoading,
    error: demosError,
    data: demosData,
  } = useQuery<{ lyricDemos: ILyricDemo[] }>(LYRIC_DEMOS);

  const {
    loading: lyricsLoading,
    error: lyricsError,
    data: lyricsData,
  } = useQuery<{ lyrics: ILyric[] }>(ALL_LYRICS, {
    skip: !selectedDemo,
    variables: {
      tags: null,
      keyword: null,
      emojis: null,
      dateFrom: null,
      dateTo: null,
      referencesOnly: null,
      favoritesOnly: null,
      hiddenOnly: null,
      demoName: selectedDemo,
    },
  });

  const demos = useMemo(
    () => demosData?.lyricDemos ?? [],
    [demosData?.lyricDemos]
  );
  const lyrics = useMemo(() => lyricsData?.lyrics ?? [], [lyricsData?.lyrics]);

  if (!selectedDemo) {
    if (demosLoading) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <Spinner className="size-6" />
        </div>
      );
    }

    if (demosError) {
      return <ErrorText title="Ошибка" />;
    }

    if (demos.length === 0) {
      return (
        <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
          Демок пока нет
        </div>
      );
    }

    return (
      <ul className="flex flex-col gap-2 p-4">
        {demos.map((demo) => (
          <li key={demo.name}>
            <button
              type="button"
              className="hover:bg-muted flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors"
              onClick={() => onSelectDemo(demo.name)}
            >
              <span className="text-sm font-medium">
                {formatDemoName(demo.name)}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {demo.count}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 p-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit gap-1 px-2"
          onClick={() => onSelectDemo(null)}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Назад
        </Button>

        <h3 className="px-1 text-sm font-medium">
          {formatDemoName(selectedDemo)}
        </h3>

        {lyricsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : lyricsError ? (
          <ErrorText title="Ошибка" />
        ) : lyrics.length === 0 ? (
          <p className="text-muted-foreground px-1 text-sm">Текстов нет</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lyrics.map((lyric) => (
              <li key={lyric.id}>
                <button
                  type="button"
                  className={cn(
                    'hover:bg-muted w-full rounded-lg border px-3 py-2 text-left transition-colors'
                  )}
                  onClick={() => {
                    setSelectedLyric(lyric);
                    setDeskOpen(true);
                  }}
                >
                  <p className="line-clamp-6 text-sm leading-relaxed whitespace-pre-wrap">
                    {previewLyricText(lyric.message?.text, 8)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <MessageDeskDialog
        lyric={selectedLyric}
        open={deskOpen}
        queryVariables={{
          tags: null,
          keyword: null,
          emojis: null,
          dateFrom: null,
          dateTo: null,
          referencesOnly: false,
          favoritesOnly: false,
          hiddenOnly: false,
        }}
        onOpenChange={setDeskOpen}
      />
    </>
  );
}
