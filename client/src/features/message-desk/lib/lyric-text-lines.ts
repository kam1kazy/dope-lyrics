export const splitLyricLines = (text: string): string[] => {
  return text.split(/\r?\n/);
};

export const canSplitLyricText = (text: string): boolean => {
  return (
    splitLyricLines(text).filter((line) => line.trim().length > 0).length >= 2
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

export const previewLyricHalf = (text: string, maxLines = 4): string => {
  const lines = splitLyricLines(text).filter((line) => line.trim().length > 0);

  if (lines.length <= maxLines) {
    return lines.join('\n');
  }

  return `${lines.slice(0, maxLines).join('\n')}…`;
};
