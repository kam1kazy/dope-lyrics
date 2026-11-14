import { scoreSample, type SectionFacets } from '~/modules/ai/artists/pick';
import type {
  ArtistProfile,
  ReferenceSample,
} from '~/modules/ai/artists/profiles';
import {
  FILL_FRAME_INDEXES,
  paragraphsForRole,
  SECOND_HOOK_INDEX,
  TRACK_FRAME,
  type TrackFormQuotas,
  type TrackFrameRole,
} from '~/modules/lyrics/track-assemble';

const LINK =
  /телефон|звон|набер|набир|трубк|сообщен|смс|директ|экран|сеть|рингтон|phone|call|text me|ringtone|mute|\bdm\b/i;

const INTERJECTIONS = new Set([
  'yeah',
  'yea',
  'ye',
  'uh',
  'ah',
  'ay',
  'ey',
  'eh',
  'oh',
  'ha',
  'hm',
  'yo',
  'skrt',
  "let's",
  'go',
  'е',
  'э',
  'эй',
  'ай',
  'а',
  'у',
  'ух',
  'о',
  'оу',
  'ха',
  'хм',
  'м',
  'р',
  'ра',
  'йо',
  'окей',
  'ok',
  'okay',
]);

/** Звонок, сообщения, сеть, экран — то, что эталон тащит в трек как затычку. */
export const hasLink = (text: string): boolean => LINK.test(text);

/** Строка без слов: пустая после скобок, метка части или одни междометия любой длины. */
const isFiller = (line: string): boolean => {
  const trimmed = line.trim();
  if (/^\[[^\]]*\]$/.test(trimmed)) {
    return true;
  }

  const bare = trimmed.replace(/\([^)]*\)/g, '').trim();
  if (!bare) {
    return true;
  }

  return bare
    .toLowerCase()
    .split(/[\s,!?.…—-]+/)
    .filter(Boolean)
    .every((token) => INTERJECTIONS.has(token.replace(/(.)\1+/g, '$1')));
};

const shuffle = <T>(items: readonly T[], random: () => number): T[] =>
  items
    .map((item) => ({ item, key: random() }))
    .sort((left, right) => left.key - right.key)
    .map(({ item }) => item);

const CHUNK_LINES = 4;
const CHUNK_MIN_LINES = 3;
/** Кусков от одного артиста на склейку при автоподборе. */
export const SCRATCH_ARTIST_CHUNKS = 2;
/** Кусков от одного текста на склейку при фильтре: без потолка склейка выходит «из одного трека». */
export const SCRATCH_FILTERED_TEXT_CHUNKS = 3;

/** Абзацы по пустым строкам, длинные — по четыре строки; хвост короче трёх строк — к предыдущему куску. */
export const splitIntoChunks = (text: string): string[][] =>
  text
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .flatMap((paragraph) => {
      const lines = paragraph
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !isFiller(line));
      const chunks: string[][] = [];

      for (let index = 0; index < lines.length; index += CHUNK_LINES) {
        const chunk = lines.slice(index, index + CHUNK_LINES);
        const previous = chunks[chunks.length - 1];
        if (chunk.length < CHUNK_MIN_LINES && previous) {
          previous.push(...chunk);
        } else if (chunk.length >= CHUNK_MIN_LINES) {
          chunks.push(chunk);
        }
      }

      return chunks;
    });

const chunkKey = (lines: readonly string[]): string =>
  lines.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();

export type ScratchChunk = {
  textId: number;
  artistId: number;
  artistName: string;
  title: string | null;
  lines: string[];
};

export type ScratchCollagePart = {
  role: TrackFrameRole;
  chunks: ScratchChunk[];
};

type ShelfText = {
  artistId: number;
  artistName: string;
  sample: ReferenceSample;
  chunks: string[][];
};

const scoreRole = (role: TrackFrameRole): string =>
  role === 'HOOK' ? 'HOOK' : 'VERSE';

/**
 * Склейка по форме из кусков полки. Хук набирается первым — из текстов с ролью хука.
 * Куски части — из разных текстов; при автоподборе один текст даёт один кусок на склейку,
 * артист — не больше двух. При фильтре лимит на артиста снят, а текст даёт не больше трёх кусков. Кусок со связью не берётся, если её нет в теме.
 * Выбранные тексты дают хотя бы по куску, и со связью тоже.
 */
export const pickScratchCollage = (
  pool: readonly ArtistProfile[],
  options: {
    facets: SectionFacets;
    theme: string;
    quotas: TrackFormQuotas;
    chosenTextIds?: readonly number[];
    /** Пул ограничен фильтром: лимит на артиста снят, текст даёт до `SCRATCH_FILTERED_TEXT_CHUNKS` кусков. */
    filtered?: boolean;
    random?: () => number;
  }
): ScratchCollagePart[] => {
  const random = options.random ?? Math.random;
  const chosenIds = new Set(options.chosenTextIds ?? []);
  const allowLink = hasLink(options.theme);
  const filtered = options.filtered === true;
  const texts: ShelfText[] = pool.flatMap((artist) =>
    artist.texts.map((sample) => ({
      artistId: artist.id,
      artistName: artist.name,
      sample,
      chunks: splitIntoChunks(sample.text),
    }))
  );

  const parts: ScratchCollagePart[] = TRACK_FRAME.map((role) => ({
    role,
    chunks: [],
  }));
  const usedChunks = new Set<string>();
  const textChunks = new Map<number, number>();
  const artistChunks = new Map<number, number>();

  const room = (index: number): boolean =>
    (parts[index]?.chunks.length ?? 0) <
    paragraphsForRole(options.quotas, TRACK_FRAME[index] ?? 'VERSE');

  const place = (index: number, text: ShelfText, lines: string[]) => {
    parts[index]?.chunks.push({
      textId: text.sample.id,
      artistId: text.artistId,
      artistName: text.artistName,
      title: text.sample.title,
      lines,
    });
    usedChunks.add(chunkKey(lines));
    textChunks.set(text.sample.id, (textChunks.get(text.sample.id) ?? 0) + 1);
    artistChunks.set(text.artistId, (artistChunks.get(text.artistId) ?? 0) + 1);
  };

  const freeChunks = (text: ShelfText, strict: boolean): string[][] =>
    text.chunks.filter(
      (lines) =>
        !usedChunks.has(chunkKey(lines)) &&
        (!strict || allowLink || !hasLink(lines.join('\n')))
    );

  const textFull = (text: ShelfText): boolean =>
    (textChunks.get(text.sample.id) ?? 0) >=
    (filtered ? SCRATCH_FILTERED_TEXT_CHUNKS : 1);

  const inPart = (index: number, text: ShelfText): boolean =>
    parts[index]?.chunks.some((chunk) => chunk.textId === text.sample.id) ??
    false;

  for (const text of texts.filter((item) => chosenIds.has(item.sample.id))) {
    const order = text.sample.songRole.includes('HOOK')
      ? FILL_FRAME_INDEXES
      : FILL_FRAME_INDEXES.filter((index) => TRACK_FRAME[index] !== 'HOOK');
    const index = order.find((candidate) => room(candidate));
    const clean = freeChunks(text, true);
    const lines = shuffle(
      clean.length > 0 ? clean : freeChunks(text, false),
      random
    )[0];
    if (index !== undefined && lines) {
      place(index, text, lines);
    }
  }

  for (const index of FILL_FRAME_INDEXES) {
    const role = TRACK_FRAME[index] ?? 'VERSE';
    const groups = new Map<number, ShelfText[]>();
    for (const text of texts) {
      const score = scoreSample(text.sample, scoreRole(role), options.facets);
      groups.set(score, [...(groups.get(score) ?? []), text]);
    }
    const ranked = [...groups.keys()]
      .sort((left, right) => right - left)
      .flatMap((score) => shuffle(groups.get(score) ?? [], random));

    for (const text of ranked) {
      if (!room(index)) {
        break;
      }
      if (
        inPart(index, text) ||
        textFull(text) ||
        (!filtered &&
          (artistChunks.get(text.artistId) ?? 0) >= SCRATCH_ARTIST_CHUNKS)
      ) {
        continue;
      }

      const lines = shuffle(freeChunks(text, true), random)[0];
      if (lines) {
        place(index, text, lines);
      }
    }
  }

  const hook = parts.find((part) => part.role === 'HOOK');
  const second = parts[SECOND_HOOK_INDEX];
  if (hook && second) {
    second.chunks = hook.chunks.map((chunk) => ({ ...chunk }));
  }

  return parts;
};
