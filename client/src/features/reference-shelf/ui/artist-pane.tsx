'use client';

import { useQuery } from '@apollo/client/react';
import { X } from 'lucide-react';
import { useState } from 'react';

import { ErrorText } from '@/shared/ui/error-text';
import { Hint } from '@/shared/ui/hint';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { ARTIST, type IArtist } from '../api/queries';
import { ArtistCardFormView } from './artist-card-form';
import { ReferenceTextList } from './reference-text-list';

type ArtistTab = 'texts' | 'settings';

const TABS: { key: ArtistTab; label: string }[] = [
  { key: 'texts', label: 'Тексты' },
  { key: 'settings', label: 'Настройки' },
];

/** Третий уровень полки: тексты артиста и его карточка во вкладках. */
export function ArtistPane({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  const { data, loading, error } = useQuery<{
    artist: IArtist;
    aiStatus: { enabled: boolean };
  }>(ARTIST, { variables: { id }, fetchPolicy: 'cache-and-network' });
  const [tab, setTab] = useState<ArtistTab>('texts');
  const aiEnabled = data?.aiStatus.enabled ?? false;

  if (loading && !data) {
    return (
      <div className="flex justify-center p-8">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorText title="Не удалось открыть артиста" error={error} />;
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium">
          {data.artist.name}
        </h3>
        <Hint label="Закрыть">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Закрыть артиста"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </Hint>
      </div>

      <div role="tablist" className="border-border flex gap-1 border-b pb-2">
        {TABS.map(({ key, label }) => (
          <Button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            variant={tab === key ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => {
              setTab(key);
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === 'texts' ? (
        <ReferenceTextList
          artistId={data.artist.id}
          texts={data.artist.texts}
          aiEnabled={aiEnabled}
        />
      ) : (
        <ArtistCardFormView
          key={data.artist.id}
          artist={data.artist}
          aiEnabled={aiEnabled}
          onDeleted={onClose}
        />
      )}
    </div>
  );
}
