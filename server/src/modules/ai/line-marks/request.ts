import { GraphQLError } from 'graphql';
import { z } from 'zod';

import { AiProviderError } from '~/modules/ai/model/polza.client';
import { contextBlocks } from '~/modules/ai/rewrite/request';

export type LineMark = 'RED' | 'GREEN';

export type LineMarkInput = { line: number; mark: LineMark };

const SECTION_LABEL = /^\[.+\]$/;

const MARK_SIGNS: Record<LineMark, string> = { RED: 'R', GREEN: 'G' };

/** Метится непустая строка, которая не метка части. */
export const isMarkableLine = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed !== '' && !SECTION_LABEL.test(trimmed);
};

/** Индекс строки в `aiText.split('\n')` → метка. Без красной — ошибка. */
export const validateMarks = (
  aiText: string,
  marks: readonly LineMarkInput[]
): ReadonlyMap<number, LineMark> => {
  const lines = aiText.split('\n');
  const result = new Map<number, LineMark>();

  for (const { line, mark } of marks) {
    if (
      !Number.isInteger(line) ||
      line < 0 ||
      line >= lines.length ||
      !isMarkableLine(lines[line] ?? '')
    ) {
      throw new GraphQLError(`Строку ${line + 1} нельзя пометить`);
    }

    result.set(line, mark);
  }

  if (![...result.values()].includes('RED')) {
    throw new GraphQLError('Отметьте красным хотя бы одну строку');
  }

  return result;
};

export const buildLineMarksUser = (input: {
  theme: string | null;
  authorPrompt: string;
  aiText: string;
  marks: ReadonlyMap<number, LineMark>;
}): string => {
  const numbered = input.aiText
    .split('\n')
    .map((line, index) => {
      const mark = input.marks.get(index);
      return `${index} | ${mark ? MARK_SIGNS[mark] : '·'} | ${line}`;
    })
    .join('\n');

  return [
    ...contextBlocks(input.theme, input.authorPrompt),
    `Трек построчно:\n${numbered}`,
  ].join('\n\n');
};

const answerSchema = z.object({
  lines: z.array(z.object({ n: z.number().int(), text: z.string() })),
});

const unfence = (raw: string): string =>
  raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

/**
 * Новый ответ: красные строки — из ответа модели, остальные — прежние буква в букву.
 * Лишние номера отбрасываются.
 */
export const applyLineMarksAnswer = (
  raw: string,
  aiText: string,
  marks: ReadonlyMap<number, LineMark>
): string => {
  let json: unknown;

  try {
    json = JSON.parse(unfence(raw));
  } catch {
    throw new AiProviderError('ИИ вернул правки в неожиданном формате');
  }

  const parsed = answerSchema.safeParse(json);

  if (!parsed.success) {
    throw new AiProviderError('ИИ вернул правки в неожиданном формате');
  }

  const replies = new Map(
    parsed.data.lines.map((item) => [item.n, item.text.trim()])
  );
  const lines = aiText.split('\n');

  for (const [index, mark] of marks) {
    if (mark !== 'RED') {
      continue;
    }

    const text = replies.get(index);
    if (!text || text.includes('\n')) {
      throw new AiProviderError(
        `ИИ не вернул новую строку ${index + 1}, попробуйте ещё раз`
      );
    }

    lines[index] = text;
  }

  return lines.join('\n');
};
