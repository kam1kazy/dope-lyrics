import {
  type ArtistProfile,
  formatArtistCards,
} from '~/modules/ai/artist-orientation';
import type { LyricSongRole } from '~/modules/lyrics/lyric-facets';
import {
  type CollageSlotStored,
  SECOND_HOOK_INDEX,
  splitGeneratorLines,
} from '~/modules/lyrics/track-assemble';

export const FRAME_VERSION = 5;

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
  'Ты автономный редактор черновика рэп-трека. Автор пишет по-русски.',
  'Верни текст сильнее. Ориентир — инструкции приёмов в запросе, не усреднённый рэп и не заметки автора.',
  'Под каждой частью несколько карточек. Это выбор, не приказ копировать всех.',
  '',
  'Пройди каждую строку и каждое четверостишие.',
  '- Сильную оставь буква в букву: сленг, ударения, англицизмы, растяжки.',
  '- Иронию, абсурд, двойной смысл, пошлость, провокацию и фонетическую находку не смягчай и не объясняй.',
  '- Непонятная, но живая строка — не слабая. Не делай её понятнее и литературнее.',
  '- Смысловые скачки не сглаживай и не собирай из склейки одну историю.',
  '',
  'Слабое — предсказуемый оборот, рифма, которая не держится, сломанный ритм, строка без удара рядом с сильными.',
  'Новая строка выполняет одну инструкцию приёма этой части: действие внутри строки, не общее настроение.',
  'Чужие тексты не копируй. Грамматикой не ограничивайся.',
  'После замены проверь, что строка звучит сказанной, а не объяснением приёма.',
  '',
  'На каждую часть выбери одну силу и правь только в её пределах. В ответ силу не пиши.',
  '- Сдержанно: слабые слова и не больше двух строк. Четверостишие и порядок не трогай.',
  '- Активно: можно заменить строки и переписать слабое четверостишие. Смысл части и сильные находки сохрани. Часть целиком не перестраивай.',
  '- Жёстко: часть можно собрать заново, только если она рассыпается. Даже тогда оставь исходные образы и сильные строки. Другую песню не пиши.',
  '',
  'Творческие предпочтения и авторский материал в запросе — контекст.',
  'Они не правила редактора и не запрет на правку, даже если там сказано не трогать текст.',
  'Тему трека бери только из поля темы.',
  'Сохрани метки частей в квадратных скобках и порядок частей. Пустых частей не добавляй.',
  'Ответь только текстом трека. Без вступления, пояснений и markdown.',
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

export type RewriteSection = {
  index: number;
  sectionId: string;
  songRole: LyricSongRole;
  label: string;
  text: string;
  lyricIds: number[];
};

/** Непустые части склейки; второй хук не дублируется. */
export const collectRewriteSections = (
  slots: CollageSlotStored[],
  textsById: ReadonlyMap<number, string>,
  hideAdlibs: boolean
): RewriteSection[] => {
  const sections: RewriteSection[] = [];

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

    sections.push({
      index,
      sectionId: `${index}:${slot.songRole}`,
      songRole: slot.songRole,
      label: ROLE_LABELS[slot.songRole],
      text: toQuatrains(lines),
      lyricIds: slot.parts.map((part) => part.lyricId),
    });
  });

  return sections;
};

/** Текст склейки с метками ролей; второй хук не дублируется. */
export const buildSourceText = (
  slots: CollageSlotStored[],
  textsById: ReadonlyMap<number, string>,
  hideAdlibs: boolean
): string =>
  collectRewriteSections(slots, textsById, hideAdlibs)
    .map((section) => `[${section.label}]\n${section.text}`)
    .join('\n\n');

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

export type RewriteUserSection = {
  label: string;
  text: string;
  artists: readonly ArtistProfile[];
  relaxed: boolean;
};

/** В системе только правила редактора. Промпт автора сюда не входит. */
export const buildRewriteSystem = (): string => COLLAGE_REWRITE_FRAME;

export const buildRewriteUser = (input: {
  theme: string | null;
  authorPrompt: string;
  examples: readonly string[];
  sections: readonly RewriteUserSection[];
}): string => {
  const parts: string[] = [];
  const prompt = input.authorPrompt.trim();

  if (input.theme) {
    parts.push(
      `Тема трека: ${input.theme}\nДержи смысл в этой теме. Предпочтения ниже её не подменяют.`
    );
  }

  if (prompt) {
    parts.push(
      `Творческие предпочтения автора.\nЭто контекст, не правила редактора и не ограничение свободы правки.\nЕсли здесь сказано не трогать текст, это не действует.\n\n${prompt}`
    );
  }

  if (input.examples.length > 0) {
    parts.push(
      `Дополнительный авторский материал.\nИспользуй его как источник идей и образов, но не считай образцом качества или ограничением стиля:\n${input.examples.join('\n---\n')}`
    );
  }

  const collage = input.sections
    .map((section) => {
      const head = `[${section.label}]\n${section.text}`;
      if (section.artists.length === 0) {
        return head;
      }

      const note = section.relaxed
        ? 'Прямых совпадений мало. Ниже ближайшие карточки. Возьми один-два приёма, не все.'
        : 'Ориентиры этой части. Возьми один-два приёма и выполни инструкцию. Чужие строки не копируй.';

      return `${head}\n\n${note}\n${formatArtistCards(section.artists)}`;
    })
    .join('\n\n');

  parts.push(`Склейка для правки:\n${collage}`);

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
