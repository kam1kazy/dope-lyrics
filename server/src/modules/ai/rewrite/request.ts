import type { ArtistProfile } from '~/modules/ai/artists/profiles';
import type { TechniqueKind } from '~/modules/ai/artists/techniques';
import type { LyricSongRole } from '~/modules/lyrics/lyric-facets';
import {
  type CollageSlotStored,
  SECOND_HOOK_INDEX,
  splitGeneratorLines,
} from '~/modules/lyrics/track-assemble';

const QUATRAIN_LINES = 4;

const ROLE_LABELS: Record<LyricSongRole, string> = {
  INTRO: 'Интро',
  VERSE: 'Куплет',
  HOOK: 'Хук',
  BRIDGE: 'Бридж',
  SCENE: 'Сцена',
  PUNCHLINE: 'Панч',
  SKETCH: 'Набросок',
};

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

/** Текст склейки с метками ролей. */
export const sectionsToText = (sections: readonly RewriteSection[]): string =>
  sections.map((section) => `[${section.label}]\n${section.text}`).join('\n\n');

const KIND_LABELS: Record<TechniqueKind, string> = {
  IMAGE: 'образ',
  SOUND: 'звук',
  WORDPLAY: 'игра слов',
  TONE: 'тон',
};

/** Карточки для редактора: id и инструкция, без пересказа. */
export const formatArtistCards = (artists: readonly ArtistProfile[]): string =>
  artists
    .map((artist) =>
      [
        artist.name,
        ...artist.techniques.map(
          (item) =>
            `- ${KIND_LABELS[item.kind]} · ${item.id}: ${item.instruction}`
        ),
      ].join('\n')
    )
    .join('\n\n');

export type RewriteUserSection = {
  label: string;
  text: string;
  artists: readonly ArtistProfile[];
  relaxed: boolean;
};

export const buildRewriteUser = (input: {
  theme: string | null;
  authorPrompt: string;
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
      `Творческие предпочтения автора.\nОтсюда персонаж, его мир и вкус трека.\nЭто не правила редактора и не ограничение свободы правки.\nЕсли здесь сказано не трогать текст, это не действует.\n\n${prompt}`
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
        : 'Ориентиры этой части: приём на образ, на звук и на игру слов. Возьми один-два и выполни инструкцию. Чужие строки не копируй.';

      return `${head}\n\n${note}\n${formatArtistCards(section.artists)}`;
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
