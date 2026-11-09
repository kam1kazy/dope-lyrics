import { timingSafeEqual } from 'node:crypto';

import { type Chat, tl } from '@mtcute/core';

import { prisma } from '~/infrastructure/prisma';
import { lyricsService } from '~/modules/lyrics/lyrics.service';
import { fetchNewHistory } from '~/modules/lyrics/parse/fetch-new-history';
import { lyricToHistoryItem } from '~/modules/lyrics/persist/lyric-to-history-item';
import type { TypeBotClient } from '~/mtcute/types';

export type IngestSourceKind = 'MAIN' | 'CHANNEL';
export type IngestSourceState = 'READY' | 'UNAVAILABLE' | 'ERROR';

export type IngestSourceResponse = {
  key: string;
  title: string;
  kind: IngestSourceKind;
  state: IngestSourceState;
  pendingCount: number;
};

export type IngestSourcesResponse = {
  sources: IngestSourceResponse[];
};

export type IngestApplyResponse = {
  ok: boolean;
  addedCount: number;
};

export const INGEST_TOKEN_HEADER = 'x-ingest-token';
export const MAIN_SOURCE_KEY = 'main';

let ingestLock: Promise<void> = Promise.resolve();

export const withIngestLock = async <T>(fn: () => Promise<T>): Promise<T> => {
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

type SourceRef = {
  key: string;
  kind: IngestSourceKind;
  chatId: number;
  title: string;
};

type Readable = { status: 'ok'; chat: Chat } | { status: 'unavailable' };

const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const tokenMatches = (expected: string, received: string | null): boolean => {
  if (!received) {
    return false;
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
};

// Отказ Telegram по доступу (закрытый канал, неизвестный пир) — не сбой бота
const isAccessDenied = (error: unknown): boolean =>
  tl.RpcError.is(error) && error.code !== 420 && error.code < 500;

const listUserSources = async (
  userId: number,
  mainChatId: number
): Promise<SourceRef[] | null> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return null;
  }

  const bindings = await prisma.channelBinding.findMany({
    where: { userId },
    select: { channelId: true, title: true },
    orderBy: { createdAt: 'asc' },
  });

  const sources: SourceRef[] = [];
  if (user.role === 'OWNER') {
    sources.push({
      key: MAIN_SOURCE_KEY,
      kind: 'MAIN',
      chatId: mainChatId,
      title: 'Основной чат',
    });
  }

  for (const binding of bindings) {
    sources.push({
      key: binding.channelId.toString(),
      kind: 'CHANNEL',
      chatId: Number(binding.channelId),
      title: binding.title ?? `Канал ${binding.channelId.toString()}`,
    });
  }

  return sources;
};

// Сеанс владельца читает канал, если состоит в нём или канал публичный (резолв по username через бота)
const resolveReadable = async ({
  tgAdmin,
  tgBot,
  chatId,
}: {
  tgAdmin: TypeBotClient;
  tgBot: TypeBotClient;
  chatId: number;
}): Promise<Readable> => {
  try {
    return { status: 'ok', chat: await tgAdmin.getChat(chatId) };
  } catch (error: unknown) {
    if (!isAccessDenied(error)) {
      throw error;
    }
  }

  let username: string | null = null;
  try {
    username = (await tgBot.getChat(chatId)).username;
  } catch (error: unknown) {
    if (!isAccessDenied(error)) {
      throw error;
    }
  }

  if (!username) {
    return { status: 'unavailable' };
  }

  try {
    return { status: 'ok', chat: await tgAdmin.getChat(username) };
  } catch (error: unknown) {
    if (isAccessDenied(error)) {
      return { status: 'unavailable' };
    }
    throw error;
  }
};

const fetchPending = async ({
  tgAdmin,
  chat,
  userId,
}: {
  tgAdmin: TypeBotClient;
  chat: Chat;
  userId: number;
}) => {
  const existingIds = new Set(
    await lyricsService.listKnownMessageIds(userId, chat.id)
  );
  return fetchNewHistory({ tg: tgAdmin, chatId: chat.inputPeer, existingIds });
};

const describeSource = async ({
  tgAdmin,
  tgBot,
  source,
  userId,
}: {
  tgAdmin: TypeBotClient | null;
  tgBot: TypeBotClient;
  source: SourceRef;
  userId: number;
}): Promise<IngestSourceResponse> => {
  const base = { key: source.key, title: source.title, kind: source.kind };

  if (!tgAdmin) {
    return { ...base, state: 'ERROR', pendingCount: 0 };
  }

  try {
    const readable = await resolveReadable({
      tgAdmin,
      tgBot,
      chatId: source.chatId,
    });
    if (readable.status === 'unavailable') {
      return { ...base, state: 'UNAVAILABLE', pendingCount: 0 };
    }

    const title =
      source.kind === 'MAIN' ? source.title : readable.chat.displayName;
    const fresh = await fetchPending({
      tgAdmin,
      chat: readable.chat,
      userId,
    });
    return { ...base, title, state: 'READY', pendingCount: fresh.length };
  } catch (error: unknown) {
    if (isAccessDenied(error)) {
      return { ...base, state: 'UNAVAILABLE', pendingCount: 0 };
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`MTCUTE: 🛑 Ingest ${source.key}:`, message);
    return { ...base, state: 'ERROR', pendingCount: 0 };
  }
};

const readBody = async (request: Request): Promise<Record<string, unknown>> => {
  const body: unknown = await request.json().catch(() => null);
  return isRecord(body) ? body : {};
};

const readUserId = (body: Record<string, unknown>): number | null => {
  const value = body.userId;
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : null;
};

export function startIngestHttp({
  tgAdmin,
  tgBot,
  mainChatId,
  hostname,
  port,
  token,
}: {
  tgAdmin: TypeBotClient | null;
  tgBot: TypeBotClient;
  mainChatId: number;
  hostname: string;
  port: number;
  token: string;
}) {
  if (!token && !LOOPBACK_HOSTS.has(hostname)) {
    console.error(
      `MTCUTE: 🛑 Ingest не запущен: ${hostname} доступен из сети, а INGEST_TOKEN не задан`
    );
    return;
  }

  try {
    const server = Bun.serve({
      hostname,
      port,
      async fetch(request) {
        if (request.method !== 'POST') {
          return new Response('Method Not Allowed', { status: 405 });
        }

        const path = new URL(request.url).pathname;
        if (path !== '/sources' && path !== '/apply') {
          return new Response('Not Found', { status: 404 });
        }

        if (
          token &&
          !tokenMatches(token, request.headers.get(INGEST_TOKEN_HEADER))
        ) {
          return new Response('Unauthorized', { status: 401 });
        }

        const body = await readBody(request);
        const userId = readUserId(body);
        if (userId === null) {
          return new Response('Bad Request', { status: 400 });
        }

        try {
          return await withIngestLock(async () => {
            const sources = await listUserSources(userId, mainChatId);
            if (!sources) {
              return new Response('Not Found', { status: 404 });
            }

            if (path === '/sources') {
              const described: IngestSourceResponse[] = [];
              for (const source of sources) {
                described.push(
                  await describeSource({ tgAdmin, tgBot, source, userId })
                );
              }
              const response: IngestSourcesResponse = { sources: described };
              return Response.json(response);
            }

            const source = sources.find((item) => item.key === body.key);
            if (!source) {
              return new Response('Forbidden', { status: 403 });
            }

            const failed: IngestApplyResponse = { ok: false, addedCount: 0 };
            if (!tgAdmin) {
              return Response.json(failed, { status: 503 });
            }

            const readable = await resolveReadable({
              tgAdmin,
              tgBot,
              chatId: source.chatId,
            });
            if (readable.status === 'unavailable') {
              return Response.json(failed, { status: 409 });
            }

            const fresh = await fetchPending({
              tgAdmin,
              chat: readable.chat,
              userId,
            });
            const records = fresh
              .map(lyricToHistoryItem)
              .filter((item) => item !== null);
            const addedCount = await lyricsService.loadNewRecords(
              userId,
              records
            );
            const response: IngestApplyResponse = { ok: true, addedCount };
            return Response.json(response);
          });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error('MTCUTE: 🛑 Ingest:', message);
          return Response.json({ ok: false, addedCount: 0 }, { status: 500 });
        }
      },
    });

    console.log(
      `MTCUTE: ingest слушает http://${server.hostname}:${server.port}`
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `MTCUTE: 🛑 Не удалось открыть ingest на ${hostname}:${port}: ${message}`
    );
  }
}
