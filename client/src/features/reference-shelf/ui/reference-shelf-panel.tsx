'use client';

import { useQuery } from '@apollo/client/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

import { ErrorText } from '@/shared/ui/error-text';
import { Hint } from '@/shared/ui/hint';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { ARTIST, type IArtist } from '../api/queries';
import { ArtistCardFormView } from './artist-card-form';
import { ArtistList } from './artist-list';
import { ReferenceTextList } from './reference-text-list';

function ArtistView({ id, onBack }: { id: number; onBack: () => void }) {
  const { data, loading, error } = useQuery<{
    artist: IArtist;
    aiStatus: { enabled: boolean };
  }>(ARTIST, { variables: { id }, fetchPolicy: 'cache-and-network' });
  const aiEnabled = data?.aiStatus.enabled ?? false;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <Hint label="К списку артистов">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1"
            aria-label="К списку артистов"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
            Артисты
          </Button>
        </Hint>
      </div>

      {loading && !data ? (
        <div className="flex justify-center p-8">
          <Spinner className="size-5" />
        </div>
      ) : error || !data ? (
        <ErrorText title="Не удалось открыть артиста" error={error} />
      ) : (
        <>
          <ArtistCardFormView
            key={data.artist.id}
            artist={data.artist}
            aiEnabled={aiEnabled}
            onDeleted={onBack}
          />
          <ReferenceTextList
            artistId={data.artist.id}
            texts={data.artist.texts}
            aiEnabled={aiEnabled}
          />
        </>
      )}
    </div>
  );
}

export function ReferenceShelfPanel() {
  const [artistId, setArtistId] = useState<number | null>(null);

  return artistId === null ? (
    <ArtistList onOpen={setArtistId} />
  ) : (
    <ArtistView
      id={artistId}
      onBack={() => {
        setArtistId(null);
      }}
    />
  );
}
