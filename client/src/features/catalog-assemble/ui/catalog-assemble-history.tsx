'use client';

import { useQuery } from '@apollo/client/react';

import { type ILyricCollage, LYRIC_COLLAGES } from '@/entities/lyric';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { AssembleSlotCard } from './assemble-slot-card';

function formatCollageDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CatalogAssembleHistory({
  hideAdlibs,
}: {
  hideAdlibs: boolean;
}) {
  const { loading, error, data } = useQuery<{ lyricCollages: ILyricCollage[] }>(
    LYRIC_COLLAGES
  );

  const history = data?.lyricCollages ?? [];

  if (loading) {
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
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      {history.map((collage) => (
        <article
          key={collage.id}
          className="bg-muted/30 flex flex-col gap-2 rounded-lg border p-3"
        >
          <p className="text-muted-foreground text-xs">
            {formatCollageDate(collage.createdAt)}
          </p>
          <div className="flex flex-col gap-2">
            {collage.slots.map((slot, index) => (
              <AssembleSlotCard
                key={`${collage.id}-${index}`}
                slot={slot}
                index={index}
                hideAdlibs={hideAdlibs}
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
