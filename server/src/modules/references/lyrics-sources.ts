import { z } from 'zod';

import { isAiConfigured } from '~/modules/ai/model/polza.client';
import {
  fetchPopularTrackTitlesFromGenius,
  fetchTrackLyricsFromGenius,
  isGeniusConfigured,
} from '~/modules/references/genius';
import {
  fetchTrackLyricsFromAzlyrics,
  fetchTrackLyricsFromLyricsify,
  fetchTrackLyricsFromTxtsong,
} from '~/modules/references/lyrics-extra-sites';
import {
  fetchOpenCatalogTitles,
  fetchTrackLyricsFromOpenRu,
} from '~/modules/references/lyrics-open-ru';
import {
  fetchTrackLyricsFromDarktexts,
  fetchTrackLyricsFromMusixmatch,
} from '~/modules/references/lyrics-regional';
import {
  fetchCatalogTrackTitles,
  fetchTrackLyricsFromRapRussia,
  fetchTrackLyricsFromTextLyrics,
} from '~/modules/references/lyrics-ru-catalogs';
import { fetchTrackLyricsFromWebSearch } from '~/modules/references/lyrics-web-search';

const USER_AGENT = 'dope-lyrics-reference-import/1.0 (https://github.com/)';
const DEEZER = 'https://api.deezer.com';
const LRCLIB = 'https://lrclib.net/api';

const FETCH_MS = 20_000;

import { LyricsSourceError } from '~/modules/references/import-error';

export { LyricsSourceError };

const fetchJson = async <T>(url: string, attempt = 0): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(FETCH_MS),
  });

  if (response.status === 429 && attempt < 4) {
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    return fetchJson<T>(url, attempt + 1);
  }

  if (!response.ok) {
    throw new LyricsSourceError(`HTTP ${response.status}`);
  }

  return (await response.json()) as T;
};

const dzArtistSearchSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        nb_fan: z.number().optional(),
      })
    )
    .optional(),
});

const dzTopSchema = z.object({
  data: z
    .array(
      z.object({
        title: z.string(),
        title_short: z.string().optional(),
      })
    )
    .optional(),
});

const lrclibItemSchema = z.object({
  trackName: z.string().optional(),
  artistName: z.string().optional(),
  plainLyrics: z.string().nullable().optional(),
  syncedLyrics: z.string().nullable().optional(),
  instrumental: z.boolean().optional(),
});

const lrclibSearchSchema = z.array(lrclibItemSchema);

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim();

/** Убираем таймкоды LRC, оставляем текст строк. */
export const lrcToPlain = (lrc: string): string =>
  lrc
    .split('\n')
    .map((line) => line.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim())
    .filter(Boolean)
    .join('\n');

const lyricsFromItem = (
  item: z.infer<typeof lrclibItemSchema>
): string | null => {
  if (item.instrumental) {
    return null;
  }

  const plain = item.plainLyrics?.trim();
  if (plain && plain.length >= 40) {
    return plain;
  }

  const synced = item.syncedLyrics?.trim();
  if (synced) {
    const text = lrcToPlain(synced);
    return text.length >= 40 ? text : null;
  }

  return plain && plain.length > 0 ? plain : null;
};

const scoreLyricsMatch = (
  artistName: string,
  trackTitle: string,
  item: z.infer<typeof lrclibItemSchema>
): number => {
  const itemArtist = item.artistName ?? '';
  const itemTrack = item.trackName ?? '';
  const a = normalize(artistName);
  const b = normalize(itemArtist);
  const t = normalize(trackTitle);
  const u = normalize(itemTrack);

  let score = 0;
  if (u === t || u.includes(t) || t.includes(u)) {
    score += 4;
  }
  if (b === a || b.includes(a) || a.includes(b)) {
    score += 3;
  } else if (
    itemArtist &&
    artistName
      .split(/[&/]/)
      .some((part) => normalize(part).length > 2 && b.includes(normalize(part)))
  ) {
    score += 1;
  }

  const text = lyricsFromItem(item);
  if (text && text.length >= 80) {
    score += 2;
  }

  return score;
};

const scoreArtistMatch = (wanted: string, candidate: string): number => {
  const a = normalize(wanted);
  const b = normalize(candidate);
  if (a === b) {
    return 10;
  }
  if (b.includes(a) || a.includes(b)) {
    return 5;
  }

  return 0;
};

const resolveDeezerArtistId = async (
  artistName: string
): Promise<number | null> => {
  const url = `${DEEZER}/search/artist?q=${encodeURIComponent(artistName)}`;
  const data = await fetchJson<unknown>(url);
  const parsed = dzArtistSearchSchema.safeParse(data);

  if (!parsed.success || !parsed.data.data?.length) {
    return null;
  }

  const ranked = [...parsed.data.data].sort((x, y) => {
    const byName =
      scoreArtistMatch(artistName, y.name) -
      scoreArtistMatch(artistName, x.name);
    if (byName !== 0) {
      return byName;
    }

    return (y.nb_fan ?? 0) - (x.nb_fan ?? 0);
  });

  return ranked[0]?.id ?? null;
};

const fetchPopularTrackTitlesDeezer = async (
  artistName: string,
  limit: number
): Promise<string[]> => {
  const artistId = await resolveDeezerArtistId(artistName);
  if (!artistId) {
    throw new LyricsSourceError('Артист не найден в Deezer');
  }

  const url = `${DEEZER}/artist/${artistId}/top?limit=${Math.min(limit, 50)}`;
  const data = await fetchJson<unknown>(url);
  const parsed = dzTopSchema.safeParse(data);

  if (!parsed.success || !parsed.data.data?.length) {
    throw new LyricsSourceError('Нет топ-треков в Deezer');
  }

  const seen = new Set<string>();
  const titles: string[] = [];

  for (const row of parsed.data.data) {
    const title = (row.title_short ?? row.title).replace(/\s+/g, ' ').trim();
    if (!title) {
      continue;
    }

    const key = normalize(title);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    titles.push(title);
    if (titles.length >= limit) {
      break;
    }
  }

  return titles;
};

const mergeTitles = (lists: string[][], limit: number): string[] => {
  const seen = new Set<string>();
  const titles: string[] = [];

  for (const list of lists) {
    for (const title of list) {
      const key = normalize(title);
      if (!key || seen.has(key)) {
        continue;
      }

      seen.add(key);
      titles.push(title);
      if (titles.length >= limit) {
        return titles;
      }
    }
  }

  return titles;
};

/** Топ треков: Deezer, затем каталоги. Genius — если списков нет. */
export const fetchPopularTrackTitles = async (
  artistName: string,
  limit: number
): Promise<string[]> => {
  const lists: string[][] = [];

  try {
    lists.push(await fetchPopularTrackTitlesDeezer(artistName, limit));
  } catch {
    // каталоги ниже
  }

  try {
    lists.push(await fetchCatalogTrackTitles(artistName, limit));
  } catch {
    // открытые каталоги ниже
  }

  try {
    lists.push(await fetchOpenCatalogTitles(artistName, limit));
  } catch {
    // список мог уже набраться
  }

  const merged = mergeTitles(lists, limit);
  if (merged.length > 0) {
    return merged;
  }

  if (isGeniusConfigured()) {
    return fetchPopularTrackTitlesFromGenius(artistName, limit);
  }

  throw new LyricsSourceError('Нет топ-треков');
};

export const fetchTrackLyrics = async (
  userId: number,
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string }> => {
  const params = new URLSearchParams({
    artist_name: artistName,
    track_name: trackTitle,
  });

  let best: { score: number; text: string; title: string } | null = null;

  try {
    const byGet = await fetchJson<unknown>(`${LRCLIB}/get?${params}`);
    const item = lrclibItemSchema.safeParse(byGet);
    if (item.success) {
      const text = lyricsFromItem(item.data);
      if (text) {
        const score = scoreLyricsMatch(artistName, trackTitle, item.data);
        best = {
          score,
          text,
          title: item.data.trackName?.trim() || trackTitle,
        };
      }
    }
  } catch {
    // пробуем поиск
  }

  const searchUrl = `${LRCLIB}/search?${new URLSearchParams({
    q: `${artistName} ${trackTitle}`,
  })}`;
  const searchData = await fetchJson<unknown>(searchUrl);
  const search = lrclibSearchSchema.safeParse(searchData);

  if (search.success) {
    for (const item of search.data) {
      const text = lyricsFromItem(item);
      if (!text) {
        continue;
      }

      const score = scoreLyricsMatch(artistName, trackTitle, item);
      if (!best || score > best.score) {
        best = {
          score,
          text,
          title: item.trackName?.trim() || trackTitle,
        };
      }
    }
  }

  if (best && best.score >= 3) {
    return { title: best.title, text: best.text };
  }

  const regional = [
    () => fetchTrackLyricsFromDarktexts(artistName, trackTitle),
    () => fetchTrackLyricsFromTextLyrics(artistName, trackTitle),
    () => fetchTrackLyricsFromRapRussia(artistName, trackTitle),
    () => fetchTrackLyricsFromTxtsong(artistName, trackTitle),
    () => fetchTrackLyricsFromMusixmatch(artistName, trackTitle),
    () => fetchTrackLyricsFromLyricsify(artistName, trackTitle),
    () => fetchTrackLyricsFromAzlyrics(artistName, trackTitle),
    () => fetchTrackLyricsFromOpenRu(artistName, trackTitle),
  ];

  for (const attempt of regional) {
    try {
      return await attempt();
    } catch {
      // следующий источник
    }
  }

  if (isGeniusConfigured()) {
    try {
      return await fetchTrackLyricsFromGenius(artistName, trackTitle);
    } catch {
      // пробуем веб-поиск
    }
  }

  if (process.env.REFERENCE_LYRICS_WEB === '1' && isAiConfigured()) {
    return fetchTrackLyricsFromWebSearch(userId, artistName, trackTitle);
  }

  throw new LyricsSourceError('Текст не найден во всех источниках');
};
