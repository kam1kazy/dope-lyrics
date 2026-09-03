import { GraphQLError } from 'graphql';

import { readinessFromLineCount } from '~/modules/lyrics/lyric-facets';
import {
  type GluePartPlacement,
  mapRawLinesToCleaned,
  unionLineRanges,
} from '~/modules/lyrics/lyric-glue';
import { countParagraphs, countWords } from '~/modules/lyrics/parse/text-utils';
import { splitGeneratorLines } from '~/modules/lyrics/track-assemble';

export type LyricLineRange = {
  afterLine: number;
  untilLine: number;
};

export type SliceBuildResult = {
  createdText: string;
  chunks: string[];
  cleanedTaken: { startLine: number; endLine: number }[];
  placements: GluePartPlacement[];
};

export const splitLyricLines = (text: string): string[] => {
  return text.split(/\r?\n/);
};

export const splitTextAtLine = (
  text: string,
  afterLine: number
): { top: string; bottom: string } => {
  if (!Number.isInteger(afterLine) || afterLine < 0) {
    throw new GraphQLError('Некорректная линия разреза');
  }

  const lines = splitLyricLines(text);

  if (afterLine >= lines.length - 1) {
    throw new GraphQLError('Некорректная линия разреза');
  }

  const top = lines.slice(0, afterLine + 1).join('\n');
  const bottom = lines.slice(afterLine + 1).join('\n');

  if (!top.trim() || !bottom.trim()) {
    throw new GraphQLError('После разреза обе части должны содержать текст');
  }

  return { top, bottom };
};

export const assertNonEmptyLyricText = (text: string): string => {
  const next = text.replace(/\r\n/g, '\n');

  if (!next.trim()) {
    throw new GraphQLError('Текст не может быть пустым');
  }

  return next;
};

export const textCounts = (text: string) => {
  return {
    word_count: countWords(text),
    paragraph_count: countParagraphs(text),
  };
};

export const readinessAfterTextChange = (
  current: string | null,
  paragraphCount: number
): string | null => {
  if (current === 'READY') {
    return current;
  }

  return readinessFromLineCount(paragraphCount);
};

const assertValidLineRange = (lines: string[], range: LyricLineRange): void => {
  const { afterLine, untilLine } = range;

  if (
    !Number.isInteger(afterLine) ||
    !Number.isInteger(untilLine) ||
    afterLine < 0 ||
    untilLine <= afterLine ||
    untilLine >= lines.length
  ) {
    throw new GraphQLError('Некорректный диапазон строк');
  }
};

const rawRangeOverlaps = (a: LyricLineRange, b: LyricLineRange): boolean => {
  const aStart = a.afterLine + 1;
  const aEnd = a.untilLine;
  const bStart = b.afterLine + 1;
  const bEnd = b.untilLine;

  return aStart <= bEnd && bStart <= aEnd;
};

/** Собрать текст кусков и очищенные диапазоны для выреза из донора. */
export const buildSliceFromRanges = (
  text: string,
  ranges: LyricLineRange[],
  lyricId: number
): SliceBuildResult => {
  if (ranges.length === 0) {
    throw new GraphQLError('Нечего вырезать: нет диапазонов');
  }

  const normalized = text.replace(/\r\n/g, '\n');
  const lines = splitLyricLines(normalized);
  const cleanedMap = mapRawLinesToCleaned(normalized);

  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];
    if (!range) {
      continue;
    }

    assertValidLineRange(lines, range);

    for (let other = index + 1; other < ranges.length; other += 1) {
      const next = ranges[other];
      if (next && rawRangeOverlaps(range, next)) {
        throw new GraphQLError('Диапазоны строк пересекаются');
      }
    }
  }

  const chunks: string[] = [];
  const cleanedTaken: { startLine: number; endLine: number }[] = [];
  const placements: GluePartPlacement[] = [];
  let gluedCursor = 0;

  for (const range of ranges) {
    const chunkLines = lines.slice(range.afterLine + 1, range.untilLine + 1);
    const chunk = chunkLines.join('\n');

    if (!chunk.trim()) {
      throw new GraphQLError('Фрагмент должен содержать текст');
    }

    const cleanedIndexes: number[] = [];
    for (
      let rawIndex = range.afterLine + 1;
      rawIndex <= range.untilLine;
      rawIndex += 1
    ) {
      const cleaned = cleanedMap[rawIndex];
      if (cleaned !== null && cleaned !== undefined) {
        cleanedIndexes.push(cleaned);
      }
    }

    if (cleanedIndexes.length === 0) {
      throw new GraphQLError('Фрагмент должен содержать текст');
    }

    const startLine = cleanedIndexes[0] ?? 0;
    const endLine = (cleanedIndexes[cleanedIndexes.length - 1] ?? 0) + 1;
    cleanedTaken.push({ startLine, endLine });

    const gluedLines = splitGeneratorLines(chunk);
    const gluedStart = gluedCursor;
    gluedCursor += gluedLines.length;

    placements.push({
      lyricId,
      startLine,
      endLine,
      gluedStart,
      gluedEnd: gluedCursor,
    });

    chunks.push(chunk);
  }

  return {
    createdText: chunks.join('\n\n'),
    chunks,
    cleanedTaken: unionLineRanges(cleanedTaken),
    placements,
  };
};
