import type { ScratchChunk } from '~/modules/ai/scratch/pick';

/** Подряд одинаковых слов — строка повторяет исходную. */
const RUN_WORDS = 4;
/** Доля общих значимых слов от короткой строки. */
const SHARE = 0.6;
/** Общих значимых слов, не меньше. */
const MIN_COMMON = 3;
/** Общих английских слов — строка переведена с сохранением ядер. Одно слово — разрешённое ядро. */
const MIN_COMMON_ENGLISH = 2;

const ENGLISH_FILLER = new Set([
  'the',
  'and',
  'you',
  'your',
  'that',
  'me',
  'my',
  'in',
  'on',
  'to',
  'of',
  'it',
  'is',
  'be',
  'do',
  'so',
  'we',
  'no',
  'for',
  'uh',
  'ah',
  'oh',
  'ay',
  'ayy',
  'yeah',
  'ya',
  'ye',
]);

const STOP_WORDS = new Set([
  'это',
  'эта',
  'этот',
  'тот',
  'так',
  'как',
  'без',
  'для',
  'что',
  'чтоб',
  'когда',
  'где',
  'тебя',
  'тебе',
  'тобой',
  'меня',
  'мне',
  'мной',
  'нас',
  'нам',
  'вас',
  'они',
  'она',
  'его',
  'еще',
  'уже',
  'все',
  'всё',
  'мой',
  'моя',
  'мое',
  'мои',
  'твой',
  'твоя',
  'твое',
  'твои',
  'свой',
  'своя',
  'the',
  'and',
  'you',
  'your',
  'that',
]);

const tokens = (line: string): string[] =>
  line
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

const meaningful = (words: readonly string[]): Set<string> =>
  new Set(words.filter((word) => word.length >= 3 && !STOP_WORDS.has(word)));

const sharesRun = (
  left: readonly string[],
  right: readonly string[]
): boolean => {
  const grams = new Set<string>();
  for (let index = 0; index + RUN_WORDS <= right.length; index += 1) {
    grams.add(right.slice(index, index + RUN_WORDS).join(' '));
  }
  for (let index = 0; index + RUN_WORDS <= left.length; index += 1) {
    if (grams.has(left.slice(index, index + RUN_WORDS).join(' '))) {
      return true;
    }
  }

  return false;
};

const english = (words: readonly string[]): Set<string> =>
  new Set(
    words.filter(
      (word) =>
        word.length >= 2 && /^[a-z']+$/.test(word) && !ENGLISH_FILLER.has(word)
    )
  );

const commonCount = (left: Set<string>, right: Set<string>): number =>
  [...left].filter((word) => right.has(word)).length;

const isClose = (answer: readonly string[], source: readonly string[]) => {
  if (sharesRun(answer, source)) {
    return true;
  }

  if (commonCount(english(answer), english(source)) >= MIN_COMMON_ENGLISH) {
    return true;
  }

  const left = meaningful(answer);
  const right = meaningful(source);
  const common = commonCount(left, right);
  const shorter = Math.min(left.size, right.size);

  return common >= MIN_COMMON && common / shorter >= SHARE;
};

export type CloseLine = {
  /** Номер строки ответа без пустых строк и меток частей, с нуля. */
  line: number;
  sourceLine: string;
  artistName: string;
  title: string | null;
};

const isLyricLine = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed.length > 0 && !/^\[[^\]]*\]$/.test(trimmed);
};

/** Строки ответа, которые почти повторяют строку склейки или две соседние. */
export const findCloseLines = (
  answer: string,
  chunks: readonly ScratchChunk[]
): CloseLine[] => {
  const singles = chunks.flatMap((chunk) =>
    chunk.lines.map((line) => ({ text: line, words: tokens(line), chunk }))
  );
  const pairs = chunks.flatMap((chunk) =>
    chunk.lines.slice(1).map((next, index) => {
      const line = chunk.lines[index] ?? '';
      return {
        text: `${line} / ${next}`,
        words: tokens(`${line} ${next}`),
        chunk,
      };
    })
  );
  const sources = [...singles, ...pairs];

  return answer
    .split(/\r?\n/)
    .filter(isLyricLine)
    .flatMap((line, index) => {
      const words = tokens(line);
      const source = sources.find((item) => isClose(words, item.words));
      return source
        ? [
            {
              line: index,
              sourceLine: source.text,
              artistName: source.chunk.artistName,
              title: source.chunk.title,
            },
          ]
        : [];
    });
};
