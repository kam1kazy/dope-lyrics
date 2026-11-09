import { diffWordsWithSpace } from 'diff';

export type SeamKind = 'plain' | 'ai' | 'author';

export type SeamSegment = { text: string; kind: SeamKind };

export const SEAM_STORAGE_KEY = 'dope-lyrics:track-text-seam';

/** Что в `ai` появилось относительно `source`: true — слово модели. */
const aiMarks = (source: string, ai: string): boolean[] => {
  const marks: boolean[] = [];

  for (const part of diffWordsWithSpace(source, ai)) {
    if (part.removed) {
      continue;
    }

    for (let index = 0; index < part.value.length; index += 1) {
      marks.push(part.added === true);
    }
  }

  return marks;
};

const pushSegment = (segments: SeamSegment[], text: string, kind: SeamKind) => {
  if (text.length === 0) {
    return;
  }

  const last = segments[segments.length - 1];
  if (last?.kind === kind) {
    last.text += text;
    return;
  }

  segments.push({ text, kind });
};

/**
 * Текст `final` по кускам: жёлтое — слова модели (нет в `source`),
 * зелёное — слова автора (нет в `ai`).
 */
export const buildSeam = (
  source: string,
  ai: string,
  final: string
): SeamSegment[] => {
  const marks = aiMarks(source, ai);
  const segments: SeamSegment[] = [];
  let aiPos = 0;

  for (const part of diffWordsWithSpace(ai, final)) {
    if (part.removed) {
      aiPos += part.value.length;
      continue;
    }

    if (part.added) {
      pushSegment(segments, part.value, 'author');
      continue;
    }

    for (let index = 0; index < part.value.length; index += 1) {
      pushSegment(
        segments,
        part.value.charAt(index),
        marks[aiPos + index] ? 'ai' : 'plain'
      );
    }

    aiPos += part.value.length;
  }

  return segments;
};
