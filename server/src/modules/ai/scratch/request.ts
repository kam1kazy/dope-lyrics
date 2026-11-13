import {
  buildRewriteUser,
  type RewriteUserSection,
  ROLE_LABELS,
} from '~/modules/ai/rewrite/request';
import type {
  ScratchChunk,
  ScratchCollagePart,
} from '~/modules/ai/scratch/pick';
import { SECOND_HOOK_INDEX } from '~/modules/lyrics/track-assemble';

/** Части с кусками, без второго хука — как склейка в «Поправить ИИ». */
const filledParts = (parts: readonly ScratchCollagePart[]) =>
  parts.filter(
    (part, index) => index !== SECOND_HOOK_INDEX && part.chunks.length > 0
  );

export const collageChunks = (
  parts: readonly ScratchCollagePart[]
): ScratchChunk[] => filledParts(parts).flatMap((part) => part.chunks);

/** Кусок — строфа; карточек артистов и эталонов под частью нет. */
export const collageSections = (
  parts: readonly ScratchCollagePart[]
): RewriteUserSection[] =>
  filledParts(parts).map((part) => ({
    label: ROLE_LABELS[part.role],
    text: part.chunks.map((chunk) => chunk.lines.join('\n')).join('\n\n'),
    artists: [],
    relaxed: false,
  }));

export const collageText = (parts: readonly ScratchCollagePart[]): string =>
  collageSections(parts)
    .map((section) => `[${section.label}]\n${section.text}`)
    .join('\n\n');

export type ScratchSource = {
  textId: number;
  artistName: string;
  title: string | null;
};

/** Тексты склейки по разу, в порядке появления. */
export const collageSources = (
  parts: readonly ScratchCollagePart[]
): ScratchSource[] => {
  const seen = new Set<number>();

  return collageChunks(parts).flatMap((chunk) => {
    if (seen.has(chunk.textId)) {
      return [];
    }

    seen.add(chunk.textId);
    return [
      {
        textId: chunk.textId,
        artistName: chunk.artistName,
        title: chunk.title,
      },
    ];
  });
};

export const buildScratchUser = (input: {
  theme: string;
  authorPrompt: string;
  parts: readonly ScratchCollagePart[];
}): string =>
  buildRewriteUser({
    theme: input.theme,
    authorPrompt: input.authorPrompt,
    sections: collageSections(input.parts),
  });
