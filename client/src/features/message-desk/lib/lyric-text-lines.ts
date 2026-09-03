export type LyricLineRange = {
  afterLine: number;
  untilLine: number;
};

export type SliceChunk = LyricLineRange & {
  id: string;
  text: string;
};

export const splitLyricLines = (text: string): string[] => {
  return text.split(/\r?\n/);
};

export const canSplitLyricText = (text: string): boolean => {
  return (
    splitLyricLines(text).filter((line) => line.trim().length > 0).length >= 2
  );
};

export const canEnableSecondCut = (text: string): boolean => {
  return (
    splitLyricLines(text).filter((line) => line.trim().length > 0).length >= 3
  );
};

export const isValidAfterLine = (text: string, afterLine: number): boolean => {
  const lines = splitLyricLines(text);

  if (
    !Number.isInteger(afterLine) ||
    afterLine < 0 ||
    afterLine >= lines.length - 1
  ) {
    return false;
  }

  const top = lines
    .slice(0, afterLine + 1)
    .join('\n')
    .trim();
  const bottom = lines
    .slice(afterLine + 1)
    .join('\n')
    .trim();

  return Boolean(top && bottom);
};

export const isValidLineRange = (
  text: string,
  afterLine: number,
  untilLine: number
): boolean => {
  const lines = splitLyricLines(text);

  if (
    !Number.isInteger(afterLine) ||
    !Number.isInteger(untilLine) ||
    afterLine < 0 ||
    untilLine <= afterLine ||
    untilLine >= lines.length
  ) {
    return false;
  }

  const fragment = lines
    .slice(afterLine + 1, untilLine + 1)
    .join('\n')
    .trim();

  return Boolean(fragment);
};

export const defaultAfterLine = (text: string): number => {
  const lines = splitLyricLines(text);
  const candidates: number[] = [];

  for (let index = 0; index < lines.length - 1; index += 1) {
    if (isValidAfterLine(text, index)) {
      candidates.push(index);
    }
  }

  if (candidates.length === 0) {
    return 0;
  }

  return candidates[Math.floor((candidates.length - 1) / 2)] ?? 0;
};

export const defaultUntilLine = (text: string, afterLine: number): number => {
  const lines = splitLyricLines(text);
  const candidates: number[] = [];

  for (let index = afterLine + 1; index < lines.length; index += 1) {
    if (isValidLineRange(text, afterLine, index)) {
      candidates.push(index);
    }
  }

  if (candidates.length === 0) {
    return Math.min(afterLine + 1, Math.max(lines.length - 1, 0));
  }

  return candidates[Math.floor((candidates.length - 1) / 2)] ?? afterLine + 1;
};

export const lyricHalves = (
  text: string,
  afterLine: number
): { top: string; bottom: string } => {
  const lines = splitLyricLines(text);

  return {
    top: lines.slice(0, afterLine + 1).join('\n'),
    bottom: lines.slice(afterLine + 1).join('\n'),
  };
};

export const lyricRangeText = (
  text: string,
  afterLine: number,
  untilLine: number
): string => {
  const lines = splitLyricLines(text);
  return lines.slice(afterLine + 1, untilLine + 1).join('\n');
};

export const previewLyricHalf = (text: string, maxLines = 4): string => {
  const lines = splitLyricLines(text).filter((line) => line.trim().length > 0);

  if (lines.length <= maxLines) {
    return lines.join('\n');
  }

  return `${lines.slice(0, maxLines).join('\n')}…`;
};

export const rangesOverlap = (
  a: LyricLineRange,
  b: LyricLineRange
): boolean => {
  const aStart = a.afterLine + 1;
  const aEnd = a.untilLine;
  const bStart = b.afterLine + 1;
  const bEnd = b.untilLine;

  return aStart <= bEnd && bStart <= aEnd;
};

export const isLineTaken = (
  lineIndex: number,
  chunks: LyricLineRange[]
): boolean => {
  return chunks.some(
    (chunk) => lineIndex > chunk.afterLine && lineIndex <= chunk.untilLine
  );
};

export const rangeConflictsWithChunks = (
  range: LyricLineRange,
  chunks: LyricLineRange[]
): boolean => {
  return chunks.some((chunk) => rangesOverlap(range, chunk));
};
