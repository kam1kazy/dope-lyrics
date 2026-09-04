export const CAROUSEL_HISTORY_LIMIT = 12;
export const CAROUSEL_HISTORY_PREVIEW_LINES = 12;

export type CarouselHistorySource = 'SHUFFLE' | 'QUEUE' | 'GENERATOR' | 'AI';

export const CAROUSEL_HISTORY_SOURCES: readonly CarouselHistorySource[] = [
  'SHUFFLE',
  'QUEUE',
  'GENERATOR',
  'AI',
];

export function isCarouselHistorySource(
  value: unknown
): value is CarouselHistorySource {
  return (
    typeof value === 'string' &&
    (CAROUSEL_HISTORY_SOURCES as readonly string[]).includes(value)
  );
}

export function buildCarouselPreviewText(texts: string[]): string {
  const lines: string[] = [];

  for (const text of texts) {
    for (const line of text.split('\n')) {
      if (line.trim() === '') {
        continue;
      }

      lines.push(line);

      if (lines.length >= CAROUSEL_HISTORY_PREVIEW_LINES) {
        return lines.join('\n');
      }
    }
  }

  return lines.join('\n');
}

export function pickIdsToEvict(
  rows: { id: number; createdAt: Date; isLiked: boolean }[],
  limit = CAROUSEL_HISTORY_LIMIT
): number[] {
  if (rows.length <= limit) {
    return [];
  }

  const overflow = rows.length - limit;
  const byAge = (
    left: { id: number; createdAt: Date },
    right: { id: number; createdAt: Date }
  ) => {
    const delta = left.createdAt.getTime() - right.createdAt.getTime();
    return delta !== 0 ? delta : left.id - right.id;
  };
  const newestFirst = [...rows].sort((left, right) => byAge(right, left));
  const protectedIds = new Set(
    newestFirst.slice(0, overflow).map((row) => row.id)
  );
  const candidates = rows.filter((row) => !protectedIds.has(row.id));
  const unliked = candidates.filter((row) => !row.isLiked).sort(byAge);
  const liked = candidates.filter((row) => row.isLiked).sort(byAge);

  return [...unliked, ...liked].slice(0, overflow).map((row) => row.id);
}
