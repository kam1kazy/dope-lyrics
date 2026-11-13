import { contextBlocks, ROLE_LABELS } from '~/modules/ai/rewrite/request';
import { scratchExcerpt, type ScratchPick } from '~/modules/ai/scratch/pick';
import {
  paragraphsForRole,
  SECOND_HOOK_INDEX,
  TRACK_FRAME,
  type TrackFormQuotas,
} from '~/modules/lyrics/track-assemble';

const PARAGRAPH_LINES = 4;

const linesWord = (count: number): string => {
  const tens = count % 100;
  const ones = count % 10;
  if (ones === 1 && tens !== 11) {
    return 'строка';
  }
  if (ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)) {
    return 'строки';
  }

  return 'строк';
};

/** Части формы по каркасу трека; пустые пропущены, второй хук — тот же. */
export const formatScratchForm = (quotas: TrackFormQuotas): string[] =>
  TRACK_FRAME.flatMap((role, index) => {
    const paragraphs = paragraphsForRole(quotas, role);
    if (paragraphs === 0) {
      return [];
    }

    const label = `[${ROLE_LABELS[role]}]`;
    if (index === SECOND_HOOK_INDEX) {
      return [`${label} тот же хук`];
    }

    const lines = paragraphs * PARAGRAPH_LINES;
    return [`${label} ${lines} ${linesWord(lines)}`];
  });

export const formatScratchReferences = (
  references: readonly ScratchPick[]
): string =>
  [
    'Эталоны — тексты артистов, которые любит автор. Смотри, как сделаны строка, строфа, хук и звук. Мир и строки не бери.',
    ...references.map(({ artistName, sample }, index) => {
      const title = sample.title?.trim();
      const note = sample.note?.trim();

      return [
        `Эталон ${index + 1} · ${artistName}${title ? ` — «${title}»` : ''}`,
        scratchExcerpt(sample.text),
        ...(note ? [`Чем нравится автору: ${note}`] : []),
      ].join('\n');
    }),
  ].join('\n\n');

export const buildScratchUser = (input: {
  theme: string;
  authorPrompt: string;
  references: readonly ScratchPick[];
  form: readonly string[];
}): string => {
  const parts = contextBlocks(input.theme, input.authorPrompt);

  if (input.references.length > 0) {
    parts.push(formatScratchReferences(input.references));
  }

  parts.push(`Форма трека:\n${input.form.join('\n')}`);

  return parts.join('\n\n');
};
