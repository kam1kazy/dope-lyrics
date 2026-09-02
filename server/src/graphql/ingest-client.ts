import { env } from '~/config/env';

export type LyricIngestPreview = {
  available: boolean;
  pendingCount: number;
};

export type LyricIngestResult = {
  available: boolean;
  addedCount: number;
};

const unavailablePreview = (): LyricIngestPreview => ({
  available: false,
  pendingCount: 0,
});

const unavailableResult = (): LyricIngestResult => ({
  available: false,
  addedCount: 0,
});

const postIngest = async (path: '/preview' | '/apply'): Promise<unknown> => {
  const response = await fetch(`${env.INGEST_URL}${path}`, {
    method: 'POST',
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw new Error(`ingest ${response.status}`);
  }

  const payload: unknown = await response.json();
  return payload;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export async function fetchIngestPreview(): Promise<LyricIngestPreview> {
  try {
    const payload = await postIngest('/preview');
    if (!isRecord(payload)) {
      return unavailablePreview();
    }

    return {
      available: payload.available === true,
      pendingCount:
        typeof payload.pendingCount === 'number' &&
        Number.isFinite(payload.pendingCount)
          ? Math.max(0, Math.floor(payload.pendingCount))
          : 0,
    };
  } catch {
    return unavailablePreview();
  }
}

export async function fetchIngestApply(): Promise<LyricIngestResult> {
  try {
    const payload = await postIngest('/apply');
    if (!isRecord(payload)) {
      return unavailableResult();
    }

    return {
      available: payload.available === true,
      addedCount:
        typeof payload.addedCount === 'number' &&
        Number.isFinite(payload.addedCount)
          ? Math.max(0, Math.floor(payload.addedCount))
          : 0,
    };
  } catch {
    return unavailableResult();
  }
}
