'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { INGEST_PENDING_LYRICS, LYRIC_INGEST_PREVIEW } from '@/entities/lyric';
import { Button } from '@/shared/ui/shadcn/ui/button';

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

type PreviewData = {
  lyricIngestPreview: {
    available: boolean;
    pendingCount: number;
  };
};

type ApplyData = {
  ingestPendingLyrics: {
    available: boolean;
    addedCount: number;
  };
};

interface CatalogIngestProps {
  enabled: boolean;
}

export function CatalogIngest({ enabled }: CatalogIngestProps) {
  const [confirming, setConfirming] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const { data, loading } = useQuery<PreviewData>(LYRIC_INGEST_PREVIEW, {
    skip: !enabled,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
  });

  const [ingest, { loading: applying }] = useMutation<ApplyData>(
    INGEST_PENDING_LYRICS,
    {
      update(cache, result) {
        if (!result.data?.ingestPendingLyrics.available) {
          return;
        }

        cache.writeQuery({
          query: LYRIC_INGEST_PREVIEW,
          data: {
            lyricIngestPreview: {
              available: true,
              pendingCount: 0,
            },
          },
        });
      },
    }
  );

  useEffect(() => {
    if (!enabled) {
      setConfirming(false);
      setApplyError(null);
    }
  }, [enabled]);

  const preview = data?.lyricIngestPreview;
  const pendingCount = preview?.pendingCount ?? 0;
  const showButton =
    enabled && !loading && preview?.available === true && pendingCount > 0;

  if (!enabled || loading || !showButton) {
    return null;
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2" data-swipe-ignore>
        <p className="text-sm">
          Добавить {formatMessageCount(pendingCount)} из Telegram?
        </p>
        {applyError ? (
          <p className="text-destructive text-sm">{applyError}</p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="md:h-10"
            disabled={applying}
            onClick={() => {
              setConfirming(false);
              setApplyError(null);
            }}
          >
            Не сейчас
          </Button>
          <Button
            type="button"
            className="md:h-10"
            disabled={applying}
            onClick={() => {
              setApplyError(null);
              void ingest()
                .then((result) => {
                  const payload = result.data?.ingestPendingLyrics;
                  if (!payload?.available) {
                    setApplyError('Не удалось связаться с Telegram');
                    return;
                  }

                  setConfirming(false);
                })
                .catch(() => {
                  setApplyError('Не удалось добавить сообщения');
                });
            }}
          >
            {applying ? 'Добавляю…' : 'Добавить'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2 md:h-10"
      data-swipe-ignore
      onClick={() => {
        setApplyError(null);
        setConfirming(true);
      }}
    >
      <RefreshCw className="size-4" />
      Обновить список · {pendingCount}
    </Button>
  );
}
