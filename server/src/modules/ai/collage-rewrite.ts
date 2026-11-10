import type { LyricSongRole } from '~/modules/lyrics/lyric-facets';
import {
  type CollageSlotStored,
  SECOND_HOOK_INDEX,
  splitGeneratorLines,
} from '~/modules/lyrics/track-assemble';

export const FRAME_VERSION = 3;

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
  'Ты редактор черновика рэп-трека. Автор пишет по-русски. Верни текст сильнее: его почерк, не усреднённый рэп.',
  'Тебе дают склейку из его фраз, разбитую на части с метками в квадратных скобках, и его эталоны — строки, которые он сам считает сильными.',
  '',
  'Пройди каждую строку.',
  '- Сильную оставь буква в букву, вместе со сленгом, ошибками в ударениях, англицизмами и растяжками.',
  '- Иронию, абсурд, двойные смыслы, пошлость, провокацию и фонетическую находку не смягчай и не объясняй.',
  '- Непонятная, но живая строка — не слабая. Не делай её понятнее и литературнее.',
  '- Смысловые скачки — часть стиля. Не досочиняй связок и не собирай из склейки одну историю.',
  '',
  'Слабую замени. Слабое — предсказуемый оборот, рифма, которая не держится, сломанный ритм, строка без удара рядом с сильными.',
  'Меняй слово, строку или четверостишие. Целую часть перестраивай, только если она рассыпается.',
  'Новая строка звучит как эталоны: музыкально и резко, не как литературный текст. Не ограничивайся правкой грамматики.',
  '',
  'Сохрани метки частей в квадратных скобках на отдельных строках и порядок частей. Пустых частей не добавляй.',
  'Ответь только текстом трека. Без вступления, пояснений и markdown-обёртки.',
].join('\n');

/** Последнее слово в system: промпт автора не отменяет задачу. */
export const REWRITE_JOB = [
  'Промпт автора описывает звучание. Он не запрещает правку.',
  'Слабую строку замени. Сильную оставь буква в букву.',
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

/** Только эталоны: случайные фразы из пула модель принимает за норму. */
export const pickStyleExamples = (
  references: readonly string[],
  limit: number
): string[] =>
  references
    .map(toExampleText)
    .filter((text) => text.length > 0)
    .slice(0, limit);

export const buildRewriteSystem = (authorPrompt: string): string => {
  const prompt = authorPrompt.trim();

  const head = prompt
    ? `${COLLAGE_REWRITE_FRAME}\n\nПромпт автора:\n${prompt}`
    : COLLAGE_REWRITE_FRAME;

  return `${head}\n\n${REWRITE_JOB}`;
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
    parts.push(
      `Мои эталоны — так я пишу, когда получается:\n${input.examples.join('\n---\n')}`
    );
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
