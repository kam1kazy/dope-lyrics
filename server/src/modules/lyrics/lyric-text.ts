import { GraphQLError } from 'graphql';

import { readinessFromLineCount } from '~/modules/lyrics/lyric-facets';
import { countParagraphs, countWords } from '~/modules/lyrics/parse/text-utils';

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
