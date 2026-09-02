import type { SortMode } from '@/shared/lib/lyric-view/lyric-view-context';

import type { ILyric } from '../model/types';

interface ApplyLyricViewOptions {
  sortMode: SortMode;
  shuffleSeed: number;
  pageSize?: number;
}

function shuffleLyrics(lyrics: ILyric[], seed: number): ILyric[] {
  const result = [...lyrics];
  let state = seed || 1;

  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    const current = result[index];
    const next = result[swapIndex];

    if (current === undefined || next === undefined) {
      continue;
    }

    result[index] = next;
    result[swapIndex] = current;
  }

  return result;
}

export function applyLyricView(
  lyrics: ILyric[],
  options: ApplyLyricViewOptions
): ILyric[] {
  const pageSize = options.pageSize ?? lyrics.length;

  if (pageSize > 0 && pageSize < lyrics.length) {
    const ordered: ILyric[] = [];

    for (let offset = 0; offset < lyrics.length; offset += pageSize) {
      ordered.push(
        ...applyLyricView(lyrics.slice(offset, offset + pageSize), {
          sortMode: options.sortMode,
          shuffleSeed: options.shuffleSeed + offset,
        })
      );
    }

    return ordered;
  }

  if (options.sortMode === 'shuffle') {
    return shuffleLyrics(lyrics, options.shuffleSeed);
  }

  return lyrics;
}
