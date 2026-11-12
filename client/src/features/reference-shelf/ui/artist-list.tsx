'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { formatQueryError } from '@/shared/lib/format-query-error';
import { ErrorText } from '@/shared/ui/error-text';
import { Hint } from '@/shared/ui/hint';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  ARTISTS,
  CREATE_ARTIST,
  type IArtist,
  type IArtistListItem,
} from '../api/queries';

const textCountLabel = (count: number): string => {
  const tail = count % 10;
  const tens = count % 100;

  if (tail === 1 && tens !== 11) {
    return `${count} текст`;
  }

  if (tail >= 2 && tail <= 4 && (tens < 12 || tens > 14)) {
    return `${count} текста`;
  }

  return `${count} текстов`;
};

export function ArtistList({ onOpen }: { onOpen: (id: number) => void }) {
  const { data, loading, error } = useQuery<{ artists: IArtistListItem[] }>(
    ARTISTS,
    { fetchPolicy: 'cache-and-network' }
  );
  const [name, setName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createArtist, { loading: creating }] = useMutation<{
    createArtist: IArtist;
  }>(CREATE_ARTIST, { refetchQueries: [ARTISTS] });

  const handleCreate = async () => {
    setCreateError(null);

    try {
      const { data: created } = await createArtist({ variables: { name } });

      if (created) {
        setName('');
        onOpen(created.createArtist.id);
      }
    } catch (caught: unknown) {
      setCreateError(formatQueryError(caught));
    }
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center p-8">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorText title="Не удалось открыть эталоны" error={error} />;
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) {
            void handleCreate();
          }
        }}
      >
        <Input
          data-swipe-ignore
          value={name}
          maxLength={80}
          placeholder="Имя артиста"
          aria-label="Имя нового артиста"
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <Hint label="Добавить артиста">
          <Button
            type="submit"
            size="icon"
            className="size-9 shrink-0"
            aria-label="Добавить артиста"
            disabled={!name.trim() || creating}
          >
            {creating ? (
              <Spinner className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
          </Button>
        </Hint>
      </form>
      {createError ? (
        <p className="text-destructive text-xs">{createError}</p>
      ) : null}

      {data.artists.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Артистов пока нет. Добавьте того, у кого хочется учиться.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {data.artists.map((artist) => (
            <Button
              key={artist.id}
              type="button"
              variant="ghost"
              className="h-auto justify-between gap-2 py-2 font-normal"
              onClick={() => {
                onOpen(artist.id);
              }}
            >
              <span className="truncate text-sm">{artist.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {textCountLabel(artist.textCount)}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
