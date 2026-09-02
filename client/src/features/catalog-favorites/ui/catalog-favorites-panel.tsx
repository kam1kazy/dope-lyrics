'use client';

import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';

import { ALL_LYRICS, type ILyric, previewLyricText } from '@/entities/lyric';
import { MessageDeskDialog } from '@/features/message-desk';
import { cn } from '@/shared/lib/utils/cn';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

const shelfQueryVariables = {
  tags: null,
  keyword: null,
  emojis: null,
  dateFrom: null,
  dateTo: null,
  referencesOnly: null,
  favoritesOnly: true,
  hiddenOnly: null,
  demoName: null,
};

export function CatalogFavoritesPanel() {
  const [selectedLyric, setSelectedLyric] = useState<ILyric | null>(null);
  const [deskOpen, setDeskOpen] = useState(false);

  const { loading, error, data } = useQuery<{ lyrics: ILyric[] }>(ALL_LYRICS, {
    variables: shelfQueryVariables,
  });

  const lyrics = useMemo(() => data?.lyrics ?? [], [data?.lyrics]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error) {
    return <ErrorText title="Ошибка" />;
  }

  if (lyrics.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
        Пока ничего нет
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2 p-4">
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
              <p className="line-clamp-3 text-sm leading-relaxed whitespace-pre-wrap">
                {previewLyricText(lyric.message?.text)}
              </p>
            </button>
          </li>
        ))}
      </ul>

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
          favoritesOnly: true,
          hiddenOnly: false,
        }}
        onOpenChange={setDeskOpen}
      />
    </>
  );
}
