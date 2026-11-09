import { GraphQLError } from 'graphql';

import { env } from '~/config/env';
import type {
  IngestApplyResponse,
  IngestSourceKind,
  IngestSourceResponse,
  IngestSourceState,
} from '~/mtcute/ingest-http';

const INGEST_TIMEOUT_MS = 5 * 60_000;
const BOT_UNAVAILABLE = 'Бот недоступен';

const SOURCE_KINDS: ReadonlySet<string> = new Set<IngestSourceKind>([
  'MAIN',
  'CHANNEL',
]);
const SOURCE_STATES: ReadonlySet<string> = new Set<IngestSourceState>([
  'READY',
  'UNAVAILABLE',
  'ERROR',
]);

const isSourceKind = (value: unknown): value is IngestSourceKind =>
  typeof value === 'string' && SOURCE_KINDS.has(value);

const isSourceState = (value: unknown): value is IngestSourceState =>
  typeof value === 'string' && SOURCE_STATES.has(value);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const toCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;

const postIngest = async (
  path: '/sources' | '/apply',
  body: Record<string, unknown>
): Promise<{ status: number; payload: unknown }> => {
  try {
    const response = await fetch(`${env.INGEST_URL}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ingest-token': env.INGEST_TOKEN,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(INGEST_TIMEOUT_MS),
    });
    const payload: unknown = await response.json().catch(() => null);
    return { status: response.status, payload };
  } catch {
    throw new GraphQLError(BOT_UNAVAILABLE);
  }
};

const toSource = (value: unknown): IngestSourceResponse | null => {
  if (!isRecord(value)) {
    return null;
  }
  const { key, title, kind, state } = value;
  if (
    typeof key !== 'string' ||
    typeof title !== 'string' ||
    !isSourceKind(kind) ||
    !isSourceState(state)
  ) {
    return null;
  }
  return { key, title, kind, state, pendingCount: toCount(value.pendingCount) };
};

export async function fetchIngestSources(
  userId: number
): Promise<IngestSourceResponse[]> {
  const { status, payload } = await postIngest('/sources', { userId });
  if (status !== 200 || !isRecord(payload) || !Array.isArray(payload.sources)) {
    throw new GraphQLError(BOT_UNAVAILABLE);
  }
  return payload.sources.map(toSource).filter((source) => source !== null);
}

export async function applyIngestSource(
  userId: number,
  key: string
): Promise<IngestApplyResponse> {
  const { status, payload } = await postIngest('/apply', { userId, key });
  if (status === 403) {
    throw new GraphQLError('Нет доступа');
  }
  if (!isRecord(payload)) {
    throw new GraphQLError(BOT_UNAVAILABLE);
  }
  return {
    ok: status === 200 && payload.ok === true,
    addedCount: toCount(payload.addedCount),
  };
}
