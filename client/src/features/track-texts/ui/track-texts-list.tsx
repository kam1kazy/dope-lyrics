'use client';

import { useQuery } from '@apollo/client/react';

import { formatRuDateTime } from '@/shared/lib/format-datetime';
import { ErrorText } from '@/shared/ui/error-text';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { type ITrackTextItem, TRACK_TEXTS } from '../api/queries';

export function TrackTextsList({
  selectedId,
  onSelect,
}: {
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const { data, loading, error } = useQuery<{ trackTexts: ITrackTextItem[] }>(
    TRACK_TEXTS,
    { fetchPolicy: 'cache-and-network' }
  );

  if (loading && !data) {
    return (
      <div className="flex justify-center p-8">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorText title="Не удалось загрузить тексты" error={error} />;
  }

  if (data.trackTexts.length === 0) {
    return (
      <p className="text-muted-foreground p-4 text-sm">
        Сохранённых текстов пока нет
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {data.trackTexts.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant={selectedId === item.id ? 'secondary' : 'ghost'}
          className="h-auto flex-col items-start gap-0.5 py-2"
          onClick={() => {
            onSelect(item.id);
          }}
        >
          <span className="max-w-full truncate text-sm">
            {item.theme ?? 'Без темы'}
          </span>
          <span className="text-muted-foreground text-xs font-normal">
            {formatRuDateTime(item.createdAt)}
            {item.doneAt ? ' · готово' : ''}
          </span>
        </Button>
      ))}
    </div>
  );
}
