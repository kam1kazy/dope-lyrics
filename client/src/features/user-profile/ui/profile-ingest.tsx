'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { apolloClient } from '@/shared/api';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  type IIngestSource,
  INGEST_SOURCE,
  INGEST_SOURCES,
} from '../api/queries';

function formatMessageCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} сообщение`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} сообщения`;
  }

  return `${count} сообщений`;
}

function sourceStatus(source: IIngestSource): string {
  if (source.state === 'UNAVAILABLE') {
    return 'История недоступна — новые посты приходят сами';
  }

  if (source.state === 'ERROR') {
    return 'Не удалось проверить';
  }

  if (source.pendingCount === 0) {
    return 'Новых нет';
  }

  return `Новых: ${formatMessageCount(source.pendingCount)}`;
}

type SourcesData = { ingestSources: IIngestSource[] };
type ApplyData = { ingestSource: { ok: boolean; addedCount: number } };

function IngestSourceRow({
  source,
  onApplied,
}: {
  source: IIngestSource;
  onApplied: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [apply, { loading: applying }] = useMutation<ApplyData>(INGEST_SOURCE);

  const canApply = source.state === 'READY' && source.pendingCount > 0;

  const handleApply = () => {
    setMessage(null);
    setFailed(false);
    void apply({ variables: { key: source.key } })
      .then((result) => {
        const payload = result.data?.ingestSource;
        if (!payload?.ok) {
          setFailed(true);
          setMessage('Не удалось докачать');
          return;
        }

        setConfirming(false);
        setMessage(`Добавлено: ${formatMessageCount(payload.addedCount)}`);
        onApplied();
      })
      .catch(() => {
        setFailed(true);
        setMessage('Не удалось докачать');
      });
  };

  return (
    <li className="border-border flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{source.title}</p>
          <p className="text-muted-foreground text-xs">
            {sourceStatus(source)}
          </p>
        </div>
        {canApply && !confirming ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            onClick={() => {
              setMessage(null);
              setConfirming(true);
            }}
          >
            <RefreshCw className="size-4" />
            Докачать
          </Button>
        ) : null}
      </div>

      {confirming ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            Добавить {formatMessageCount(source.pendingCount)} из «
            {source.title}»?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={applying}
              onClick={() => {
                setConfirming(false);
                setMessage(null);
              }}
            >
              Не сейчас
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={applying}
              onClick={handleApply}
            >
              {applying ? 'Докачиваю…' : 'Добавить'}
            </Button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          className={
            failed
              ? 'text-destructive text-sm'
              : 'text-muted-foreground text-sm'
          }
        >
          {message}
        </p>
      ) : null}
    </li>
  );
}

export function ProfileIngest() {
  const { data, loading, error } = useQuery<SourcesData>(INGEST_SOURCES, {
    fetchPolicy: 'network-only',
  });

  const sources = data?.ingestSources ?? [];

  // Активные запросы — и счётчики источников, и списки фраз в карусели
  const handleApplied = () => {
    void apolloClient.refetchQueries({ include: 'active' });
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Подкачка</h3>

      {loading && !data ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Spinner className="size-4" />
          Проверяю…
        </div>
      ) : null}

      {error ? (
        <p className="text-muted-foreground text-sm">
          Не удалось проверить: бот не отвечает
        </p>
      ) : null}

      {!loading && !error && sources.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Источников нет. Привяжите свой канал командой /channel в боте — новые
          посты будут попадать в каталог сами.
        </p>
      ) : null}

      {sources.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {sources.map((source) => (
            <IngestSourceRow
              key={source.key}
              source={source}
              onApplied={handleApplied}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
