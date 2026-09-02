import { lyricsService } from '~/modules/lyrics/lyrics.service';
import { fetchNewHistory } from '~/modules/lyrics/parse/fetch-new-history';
import { lyricToHistoryItem } from '~/modules/lyrics/persist/lyric-to-history-item';
import type { TypeBotClient } from '~/mtcute/types';

export type IngestPreviewResponse = {
  available: boolean;
  pendingCount: number;
};

export type IngestApplyResponse = {
  available: boolean;
  addedCount: number;
};

let ingestLock: Promise<void> = Promise.resolve();

const withIngestLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  const previous = ingestLock;
  let release = () => {};
  ingestLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await fn();
  } finally {
    release();
  }
};

export function startIngestHttp({
  tgAdmin,
  channelId,
  port,
}: {
  tgAdmin: TypeBotClient | null;
  channelId: number;
  port: number;
}) {
  try {
    const server = Bun.serve({
      hostname: '127.0.0.1',
      port,
      async fetch(request) {
        if (request.method !== 'POST') {
          return new Response('Method Not Allowed', { status: 405 });
        }

        const path = new URL(request.url).pathname;

        if (path !== '/preview' && path !== '/apply') {
          return new Response('Not Found', { status: 404 });
        }

        if (!tgAdmin) {
          const body: IngestPreviewResponse & IngestApplyResponse = {
            available: false,
            pendingCount: 0,
            addedCount: 0,
          };
          return Response.json(body);
        }

        try {
          return await withIngestLock(async () => {
            const existingIds = new Set(await lyricsService.listLyricIds());
            const fresh = await fetchNewHistory({
              tg: tgAdmin,
              chatId: channelId,
              existingIds,
            });

            if (path === '/preview') {
              const body: IngestPreviewResponse = {
                available: true,
                pendingCount: fresh.length,
              };
              return Response.json(body);
            }

            const records = fresh
              .map(lyricToHistoryItem)
              .filter((item) => item !== null);
            const addedCount = await lyricsService.loadNewRecords(records);
            const body: IngestApplyResponse = {
              available: true,
              addedCount,
            };
            return Response.json(body);
          });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error('MTCUTE: 🛑 Ingest:', message);
          return Response.json(
            { available: false, pendingCount: 0, addedCount: 0 },
            { status: 500 }
          );
        }
      },
    });

    console.log(
      `MTCUTE: ingest слушает http://${server.hostname}:${server.port}`
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `MTCUTE: 🛑 Не удалось открыть ingest на 127.0.0.1:${port}: ${message}`
    );
  }
}
