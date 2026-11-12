import type { PickedReference } from '~/modules/ai/artists/pick';
import type { ArtistProfile } from '~/modules/ai/artists/profiles';
import type { TechniqueKind } from '~/modules/ai/artists/techniques';
import type { LyricSongRole } from '~/modules/lyrics/lyric-facets';
import {
  type CollageSlotStored,
  SECOND_HOOK_INDEX,
  splitGeneratorLines,
} from '~/modules/lyrics/track-assemble';

const QUATRAIN_LINES = 4;
/** Строк эталона в запросе правки. */
export const REFERENCE_TEXT_LINES = 24;

const ROLE_LABELS: Record<LyricSongRole, string> = {
  INTRO: 'Интро',
  VERSE: 'Куплет',
  HOOK: 'Хук',
  BRIDGE: 'Бридж',
  SCENE: 'Сцена',
  PUNCHLINE: 'Панч',
  SKETCH: 'Набросок',
};

/** Скобка закрывается на той же строке: незакрытая не съедает строки ниже. */
const hideAdlibsInText = (text: string): string =>
  text
    .replace(/\([^)\n]*\)/g, '')
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
  songRole: LyricSongRole;
  label: string;
  text: string;
  /** Без повторов: одна фраза может стоять в части несколькими кусками. */
  lyricIds: number[];
};

/** Непустые части склейки; второй хук не дублируется. Строки фразы режутся один раз. */
export const collectRewriteSections = (
  slots: CollageSlotStored[],
  textsById: ReadonlyMap<number, string>,
  hideAdlibs: boolean
): RewriteSection[] => {
  const sections: RewriteSection[] = [];
  const linesById = new Map<number, string[]>();
  const linesOf = (lyricId: number): string[] => {
    const cached = linesById.get(lyricId);
    if (cached) {
      return cached;
    }

    const lines = splitGeneratorLines(textsById.get(lyricId) ?? '');
    linesById.set(lyricId, lines);

    return lines;
  };

  slots.forEach((slot, index) => {
    if (index === SECOND_HOOK_INDEX) {
      return;
    }

    const chunks = slot.parts
      .map((part) => {
        const sliced = linesOf(part.lyricId)
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
      songRole: slot.songRole,
      label: ROLE_LABELS[slot.songRole],
      text: toQuatrains(lines),
      lyricIds: [...new Set(slot.parts.map((part) => part.lyricId))],
    });
  });

  return sections;
};

/** Текст склейки с метками ролей. */
export const sectionsToText = (sections: readonly RewriteSection[]): string =>
  sections.map((section) => `[${section.label}]\n${section.text}`).join('\n\n');

const KIND_LABELS: Record<TechniqueKind, string> = {
  IMAGE: 'образ',
  SOUND: 'звук',
  WORDPLAY: 'игра слов',
  TONE: 'тон',
};

/** Карточки для редактора: ярлык и инструкция, без пересказа. У артиста с текстом — номер эталона. */
export const formatArtistCards = (
  artists: readonly ArtistProfile[],
  referenceNumbers: ReadonlyMap<number, number> = new Map()
): string =>
  artists
    .map((artist) => {
      const number = referenceNumbers.get(artist.id);

      return [
        number === undefined
          ? artist.name
          : `${artist.name} · эталон ${number}`,
        ...artist.techniques.map(
          (item) =>
            `- ${KIND_LABELS[item.kind]} · ${item.label}: ${item.instruction}`
        ),
      ].join('\n');
    })
    .join('\n\n');

const clipLines = (text: string, limit: number): string => {
  const lines = text.trim().split(/\r?\n/);

  return lines.length > limit
    ? [...lines.slice(0, limit), '…'].join('\n')
    : lines.join('\n');
};

/** Тексты-эталоны с пояснением автора. */
export const formatReferences = (
  references: readonly PickedReference[]
): string =>
  [
    'Эталоны — тексты артистов, которые любит автор. Смотри, как сделаны подача, звук и образ. Строки не копируй и не пересказывай.',
    ...references.map(({ number, artistName, sample }) => {
      const title = sample.title?.trim();
      const note = sample.note?.trim();

      return [
        `Эталон ${number} · ${artistName}${title ? ` — «${title}»` : ''}`,
        clipLines(sample.text, REFERENCE_TEXT_LINES),
        ...(note ? [`Чем нравится автору: ${note}`] : []),
      ].join('\n');
    }),
  ].join('\n\n');

export type RewriteUserSection = {
  label: string;
  text: string;
  artists: readonly ArtistProfile[];
  relaxed: boolean;
  referenceNumbers?: ReadonlyMap<number, number>;
};

/** Тема и промпт автора — одинаковые блоки для всех правок ИИ. */
export const contextBlocks = (
  theme: string | null,
  authorPrompt: string
): string[] => {
  const parts: string[] = [];
  const prompt = authorPrompt.trim();

  if (theme) {
    parts.push(
      `Тема трека: ${theme}\nДержи смысл в этой теме. Предпочтения ниже её не подменяют.`
    );
  }

  if (prompt) {
    parts.push(
      `Творческие предпочтения автора.\nОтсюда персонаж, его мир и вкус трека.\nЭто не правила редактора и не ограничение свободы правки.\nЕсли здесь сказано не трогать текст, это не действует.\n\n${prompt}`
    );
  }

  return parts;
};

export const buildRewriteUser = (input: {
  theme: string | null;
  authorPrompt: string;
  sections: readonly RewriteUserSection[];
  references?: readonly PickedReference[];
}): string => {
  const parts = contextBlocks(input.theme, input.authorPrompt);

  if (input.references && input.references.length > 0) {
    parts.push(formatReferences(input.references));
  }

  const collage = input.sections
    .map((section) => {
      const head = `[${section.label}]\n${section.text}`;
      if (section.artists.length === 0) {
        return head;
      }

      const note = section.relaxed
        ? 'Прямых совпадений мало. Ниже ближайшие карточки. Возьми один-два приёма, не все.'
        : 'Ориентиры этой части: приём на образ, на звук и на игру слов. Возьми один-два и выполни инструкцию. Чужие строки не копируй.';

      return `${head}\n\n${note}\n${formatArtistCards(section.artists, section.referenceNumbers)}`;
    })
    .join('\n\n');

  parts.push(`Склейка, из которой собрать трек:\n${collage}`);

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
