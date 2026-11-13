import { scoreSample, type SectionFacets } from '~/modules/ai/artists/pick';
import type {
  ArtistProfile,
  ReferenceSample,
} from '~/modules/ai/artists/profiles';

/** Эталонов на запрос «С нуля». */
export const SCRATCH_REFERENCE_LIMIT = 3;
export const SCRATCH_EXCERPT_LINES = 24;

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
]);

/** Звонок, сообщения, сеть, экран — то, что эталон тащит в трек как затычку. */
export const hasLink = (text: string): boolean => LINK.test(text);

/** Строка без слов: пустая после скобок, метка части или одни междометия. */
const isFiller = (line: string): boolean => {
  const trimmed = line.trim();
  if (/^\[[^\]]*\]$/.test(trimmed)) {
    return true;
  }

  const bare = trimmed.replace(/\([^)]*\)/g, '').trim();
  if (!bare) {
    return true;
  }

  if (bare.split(/\s+/).length > 3) {
    return false;
  }

  return bare
    .toLowerCase()
    .split(/[\s,!?.…—-]+/)
    .filter(Boolean)
    .every((token) => INTERJECTIONS.has(token.replace(/(.)\1+/g, '$1')));
};

/** Отрывок для запроса: с первой содержательной строки. */
export const scratchExcerpt = (
  text: string,
  limit = SCRATCH_EXCERPT_LINES
): string => {
  const lines = text.trim().split(/\r?\n/);
  const start = lines.findIndex((line) => !isFiller(line));

  return start === -1
    ? ''
    : lines
        .slice(start, start + limit)
        .join('\n')
        .trim();
};

export type ScratchPick = {
  artistId: number;
  artistName: string;
  sample: ReferenceSample;
};

const shuffle = <T>(items: readonly T[], random: () => number): T[] =>
  items
    .map((item) => ({ item, key: random() }))
    .sort((left, right) => left.key - right.key)
    .map(({ item }) => item);

/**
 * Тексты, а не артисты: выбранные в фильтре идут первыми без проверок,
 * остальные — по граням темы, случайно среди равных, по одному на артиста.
 * Текст со связью в отрывке не берётся, если связи нет в теме.
 */
export const pickScratchReferences = (
  pool: readonly ArtistProfile[],
  options: {
    facets: SectionFacets;
    theme: string;
    chosenTextIds?: readonly number[];
    random?: () => number;
    limit?: number;
  }
): ScratchPick[] => {
  const limit = options.limit ?? SCRATCH_REFERENCE_LIMIT;
  const random = options.random ?? Math.random;
  const chosenIds = new Set(options.chosenTextIds ?? []);
  const entries = pool.flatMap((artist) =>
    artist.texts.map((sample) => ({
      artistId: artist.id,
      artistName: artist.name,
      sample,
    }))
  );

  const picked = entries
    .filter((entry) => chosenIds.has(entry.sample.id))
    .slice(0, limit);
  const usedArtists = new Set(picked.map((entry) => entry.artistId));
  const allowLink = hasLink(options.theme);

  const groups = new Map<number, ScratchPick[]>();
  for (const entry of entries) {
    if (
      chosenIds.has(entry.sample.id) ||
      (!allowLink && hasLink(scratchExcerpt(entry.sample.text)))
    ) {
      continue;
    }

    const score = scoreSample(entry.sample, '', options.facets);
    groups.set(score, [...(groups.get(score) ?? []), entry]);
  }

  const scores = [...groups.keys()].sort((left, right) => right - left);
  for (const score of scores) {
    for (const entry of shuffle(groups.get(score) ?? [], random)) {
      if (picked.length >= limit) {
        return picked;
      }
      if (usedArtists.has(entry.artistId)) {
        continue;
      }

      usedArtists.add(entry.artistId);
      picked.push(entry);
    }
  }

  return picked;
};
