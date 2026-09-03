'use client';

import { useQuery } from '@apollo/client/react';

import { type ILyricCollage, LYRIC_COLLAGES } from '@/entities/lyric';
import { cn } from '@/shared/lib/utils/cn';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { collagePreviewText } from '../lib/generator-text';

export function CatalogAssembleHistory({
  hideAdlibs,
  selectedId,
  onSelect,
}: {
  hideAdlibs: boolean;
  selectedId: number | null;
  onSelect: (collage: ILyricCollage) => void;
}) {
  const { loading, error, data } = useQuery<{ lyricCollages: ILyricCollage[] }>(
    LYRIC_COLLAGES,
    { fetchPolicy: 'cache-and-network' }
  );

  const history = data?.lyricCollages ?? [];

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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
      {history.map((collage) => {
        const selected = collage.id === selectedId;
        const preview = collagePreviewText(collage.slots, hideAdlibs);

        return (
          <button
            key={collage.id}
            type="button"
            aria-pressed={selected}
            className={cn(
              'hover:bg-muted/50 w-full rounded-md px-3 py-2.5 text-left transition-colors',
              selected && 'bg-muted'
            )}
            onClick={() => {
              onSelect(collage);
            }}
          >
            <p className="line-clamp-2 text-sm leading-snug whitespace-pre-wrap">
              {preview}
            </p>
          </button>
        );
      })}
    </div>
  );
}
