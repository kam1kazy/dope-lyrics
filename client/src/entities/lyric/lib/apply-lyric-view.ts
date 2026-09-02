import type { SortMode } from '@/shared/lib/lyric-view/lyric-view-context';

import type { ILyric } from '../model/types';

interface ApplyLyricViewOptions {
  sortMode: SortMode;
  shuffleSeed: number;
  selectedTags: string[];
  keyword: string;
}

export function collectTags(lyrics: ILyric[]): string[] {
  const tags = new Set<string>();

  for (const lyric of lyrics) {
    for (const tag of lyric.message?.hashtags?.tags ?? []) {
      const value = tag.trim();

      if (value) {
        tags.add(value);
      }
    }
  }

  return [...tags].sort((a, b) => a.localeCompare(b, 'ru'));
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
  let list = lyrics.filter(
    (lyric) => (lyric.message?.text ?? '').trim() !== ''
  );

  if (options.selectedTags.length > 0) {
    const selected = new Set(options.selectedTags);

    list = list.filter((lyric) =>
      (lyric.message?.hashtags?.tags ?? []).some((tag) => selected.has(tag))
    );
  }

  const keyword = options.keyword.trim().toLowerCase();

  if (keyword) {
    list = list.filter((lyric) =>
      (lyric.message?.text ?? '').toLowerCase().includes(keyword)
    );
  }

  if (options.sortMode === 'reverse') {
    return [...list].reverse();
  }

  if (options.sortMode === 'shuffle') {
    return shuffleLyrics(list, options.shuffleSeed);
  }

  return list;
}
