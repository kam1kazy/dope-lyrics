import type { LyricSongRole } from '~/modules/lyrics/lyric-facets';
import {
  type CollageSlotStored,
  SECOND_HOOK_INDEX,
  splitGeneratorLines,
} from '~/modules/lyrics/track-assemble';

export const FRAME_VERSION = 1;

const QUATRAIN_LINES = 4;
const MAX_EXAMPLE_LINES = 8;

const ROLE_LABELS: Record<LyricSongRole, string> = {
  INTRO: 'Интро',
  VERSE: 'Куплет',
  HOOK: 'Хук',
  BRIDGE: 'Бридж',
  SCENE: 'Сцена',
  PUNCHLINE: 'Панч',
  SKETCH: 'Набросок',
};

export const COLLAGE_REWRITE_FRAME = [
  'Ты помогаешь автору править черновик его рэп-трека. Автор пишет по-русски.',
  'Тебе дают склейку из его старых фраз, разбитую на части с метками в квадратных скобках, и примеры того, как он пишет.',
  'Перепиши склейку так, чтобы она звучала как цельный текст автора: свяжи куски, убери швы, выровняй ритм и рифмы. Можно менять строки как угодно, если так лучше.',
  'Сохрани метки частей в квадратных скобках на отдельных строках и порядок частей. Пустых частей не добавляй.',
  'Ответь только текстом трека. Без вступления, пояснений и markdown-обёртки.',
].join('\n');

const hideAdlibsInText = (text: string): string =>
  text
    .replace(/\([^)]*\)/g, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');

const toQuatrains = (lines: string[]): string => {
  const stanzas: string[] = [];

  for (let index = 0; index < lines.length; index += QUATRAIN_LINES) {
    stanzas.push(lines.slice(index, index + QUATRAIN_LINES).join('\n'));
  }

  return stanzas.join('\n\n');
};

/** Текст склейки с метками ролей; второй хук не дублируется. */
export const buildSourceText = (
  slots: CollageSlotStored[],
  textsById: ReadonlyMap<number, string>,
  hideAdlibs: boolean
): string => {
  const blocks: string[] = [];

  slots.forEach((slot, index) => {
    if (index === SECOND_HOOK_INDEX) {
      return;
    }

    const chunks = slot.parts
      .map((part) => {
        const raw = textsById.get(part.lyricId);
        if (!raw) {
          return '';
        }

        const sliced = splitGeneratorLines(raw)
          .slice(part.startLine, part.endLine)
          .join('\n');

        return hideAdlibs ? hideAdlibsInText(sliced) : sliced;
      })
      .filter((chunk) => chunk.length > 0);

    const lines = chunks.join('\n').split('\n').filter(Boolean);
    if (lines.length === 0) {
      return;
    }

    blocks.push(`[${ROLE_LABELS[slot.songRole]}]\n${toQuatrains(lines)}`);
  });

  return blocks.join('\n\n');
};

/** Пример для модели: чистый текст, не длиннее 8 строк. */
export const toExampleText = (raw: string): string =>
  splitGeneratorLines(raw).slice(0, MAX_EXAMPLE_LINES).join('\n');

const shuffled = <T>(items: readonly T[]): T[] => {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    const other = copy[swap];
    if (current === undefined || other === undefined) {
      continue;
    }

    copy[index] = other;
    copy[swap] = current;
  }

  return copy;
};

/** Эталоны первыми (до половины лимита), остальное — случайно из пула. */
export const pickStyleExamples = (
  references: readonly string[],
  pool: readonly string[],
  limit: number
): string[] => {
  const picked = references
    .map(toExampleText)
    .filter((text) => text.length > 0)
    .slice(0, Math.ceil(limit / 2));

  const rest = shuffled(
    pool.map(toExampleText).filter((text) => text.length > 0)
  ).slice(0, limit - picked.length);

  return [...picked, ...rest];
};

export const buildRewriteSystem = (authorPrompt: string): string => {
  const prompt = authorPrompt.trim();

  return prompt
    ? `${COLLAGE_REWRITE_FRAME}\n\nПромпт автора:\n${prompt}`
    : COLLAGE_REWRITE_FRAME;
};

export const buildRewriteUser = (input: {
  theme: string | null;
  examples: readonly string[];
  sourceText: string;
}): string => {
  const parts: string[] = [];

  if (input.theme) {
    parts.push(`Тема трека: ${input.theme}`);
  }

  if (input.examples.length > 0) {
    parts.push(`Примеры, как я пишу:\n${input.examples.join('\n---\n')}`);
  }

  parts.push(`Склейка для правки:\n${input.sourceText}`);

  return parts.join('\n\n');
};

/** Срезает «Вот текст:» и обёртку из тройных кавычек. */
export const stripModelWrapper = (text: string): string => {
  let result = text.trim();

  const fenced = /^```[a-zA-Zа-яА-Я]*\n([\s\S]*?)\n?```$/.exec(result);
  if (fenced?.[1] !== undefined) {
    result = fenced[1].trim();
  }

  const lines = result.split('\n');
  const first = lines[0]?.trim() ?? '';
  if (/^(вот|держи|ниже|конечно)[^[\n]*:$/i.test(first)) {
    result = lines.slice(1).join('\n').trim();
  }

  const unwrapped = /^```[a-zA-Zа-яА-Я]*\n([\s\S]*?)\n?```$/.exec(result);
  if (unwrapped?.[1] !== undefined) {
    result = unwrapped[1].trim();
  }

  return result;
};
