import type { LyricSongRole } from '~/modules/lyrics/lyric-facets';
import {
  type CollageSlotStored,
  SECOND_HOOK_INDEX,
  splitGeneratorLines,
} from '~/modules/lyrics/track-assemble';

export const FRAME_VERSION = 2;

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
  'Ты редактор черновика рэп-трека. Автор пишет по-русски. Текст его, не твой: сделай автора сильнее, а не похожим на усреднённую модель.',
  'Тебе дают склейку из его фраз, разбитую на части с метками в квадратных скобках, и его эталоны — строки, которые он сам считает сильными.',
  '',
  'Что сохранять:',
  '- Строки, которые не правишь, оставь буква в букву, вместе со сленгом, ошибками в ударениях и англицизмами.',
  '- Иронию, абсурд, двойные смыслы, пошлость и провокацию не смягчай, не объясняй и не делай серьёзными.',
  '- Странное не значит плохое. Если строка непонятна, сначала ищи в ней шутку, подтекст или звук. Не нашёл — оставь как есть.',
  '- Строка может держаться на подаче: на звуке, растяжке, интонации. Не правь её ради логики или грамматики.',
  '- Смысловые скачки между кусками — часть стиля. Не досочиняй связующих строк и не превращай склейку в линейную историю.',
  '',
  'Что можно править:',
  '- Только явно слабое: сломанный ритм, лишнее слово, рифма, которая разваливает строку, банальность без характера.',
  '- Правь локально: проблема в слове — меняй слово, не строку. Не больше одной-двух строк на четверостишие.',
  '- Новая строка должна звучать как эталоны автора, а не как литературный текст.',
  '',
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
