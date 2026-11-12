import { z } from 'zod';

import { env } from '~/config/env';
import { LyricsSourceError } from '~/modules/references/import-error';

const GENIUS_API = 'https://api.genius.com';
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_MS = 25_000;

export const isGeniusConfigured = (): boolean =>
  Boolean(env.GENIUS_ACCESS_TOKEN.trim());

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim();

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

const metaSchema = z.object({
  meta: z.object({ status: z.number() }),
});

const geniusFetch = async <T>(path: string): Promise<T> => {
  const token = env.GENIUS_ACCESS_TOKEN.trim();
  if (!token) {
    throw new LyricsSourceError(
      'Genius: задайте GENIUS_ACCESS_TOKEN в server/.env'
    );
  }

  const response = await fetch(`${GENIUS_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(FETCH_MS),
  });

  const data = (await response.json()) as unknown;
  const meta = metaSchema.safeParse(data);
  if (!meta.success || meta.data.meta.status !== 200) {
    throw new LyricsSourceError('Genius API отклонил запрос');
  }

  return data as T;
};

const searchHitSchema = z.object({
  response: z.object({
    hits: z
      .array(
        z.object({
          result: z.object({
            id: z.number().optional(),
            title: z.string().optional(),
            url: z.string().optional(),
            primary_artist: z
              .object({
                id: z.number(),
                name: z.string(),
              })
              .optional(),
            artist_names: z.string().optional(),
          }),
        })
      )
      .optional(),
  }),
});

const artistSongsSchema = z.object({
  response: z.object({
    songs: z
      .array(
        z.object({
          title: z.string(),
        })
      )
      .optional(),
  }),
});

export const htmlLyricsToPlain = (html: string): string => {
  const chunks: string[] = [];
  const pattern = /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/gi;

  for (const match of html.matchAll(pattern)) {
    const block = match[1] ?? '';
    const text = block
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim();

    if (text) {
      chunks.push(text);
    }
  }

  return chunks.join('\n\n').trim();
};

const fetchLyricsPage = async (pageUrl: string): Promise<string> => {
  const response = await fetch(pageUrl, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(FETCH_MS),
  });

  if (!response.ok) {
    throw new LyricsSourceError(`Genius: страница ${response.status}`);
  }

  const html = await response.text();
  if (
    html.includes('cf-browser-verification') ||
    html.includes('cloudflare_content')
  ) {
    throw new LyricsSourceError(
      'Genius: Cloudflare, откройте токен и гоняйте с своего IP'
    );
  }

  const text = htmlLyricsToPlain(html);
  if (text.length < 40) {
    throw new LyricsSourceError('Genius: на странице нет текста');
  }

  return text;
};

const resolveGeniusArtistId = async (
  artistName: string
): Promise<number | null> => {
  const path = `/search?q=${encodeURIComponent(artistName)}`;
  const data = await geniusFetch<unknown>(path);
  const parsed = searchHitSchema.safeParse(data);

  if (!parsed.success || !parsed.data.response.hits?.length) {
    return null;
  }

  const ranked = parsed.data.response.hits
    .map((hit) => hit.result.primary_artist)
    .filter((artist): artist is { id: number; name: string } => Boolean(artist))
    .sort(
      (a, b) =>
        scoreArtistMatch(artistName, b.name) -
        scoreArtistMatch(artistName, a.name)
    );

  return ranked[0]?.id ?? null;
};

export const fetchPopularTrackTitlesFromGenius = async (
  artistName: string,
  limit: number
): Promise<string[]> => {
  if (!isGeniusConfigured()) {
    throw new LyricsSourceError('Genius не настроен');
  }

  const artistId = await resolveGeniusArtistId(artistName);
  if (!artistId) {
    throw new LyricsSourceError('Артист не найден на Genius');
  }

  const path = `/artists/${artistId}/songs?sort=popularity&per_page=${Math.min(limit, 50)}`;
  const data = await geniusFetch<unknown>(path);
  const parsed = artistSongsSchema.safeParse(data);

  if (!parsed.success || !parsed.data.response.songs?.length) {
    throw new LyricsSourceError('Нет топ-треков на Genius');
  }

  const seen = new Set<string>();
  const titles: string[] = [];

  for (const song of parsed.data.response.songs) {
    const title = song.title.replace(/\s+/g, ' ').trim();
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

const pickSongHit = (
  artistName: string,
  trackTitle: string,
  hits: z.infer<typeof searchHitSchema>['response']['hits']
) => {
  if (!hits?.length) {
    return null;
  }

  let best: { score: number; title: string; url: string } | null = null;

  for (const hit of hits) {
    const result = hit.result;
    const title = result.title?.trim() ?? '';
    const url = result.url?.trim() ?? '';
    const artist = result.primary_artist?.name ?? result.artist_names ?? '';

    if (!title || !url) {
      continue;
    }

    let score = 0;
    const t = normalize(trackTitle);
    const u = normalize(title);
    if (u === t || u.includes(t) || t.includes(u)) {
      score += 5;
    }
    score += scoreArtistMatch(artistName, artist);

    if (!best || score > best.score) {
      best = { score, title, url };
    }
  }

  return best && best.score >= 5 ? best : null;
};

export const fetchTrackLyricsFromGenius = async (
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string }> => {
  if (!isGeniusConfigured()) {
    throw new LyricsSourceError('Genius не настроен');
  }

  const path = `/search?q=${encodeURIComponent(`${artistName} ${trackTitle}`)}`;
  const data = await geniusFetch<unknown>(path);
  const parsed = searchHitSchema.safeParse(data);

  if (!parsed.success) {
    throw new LyricsSourceError('Genius: пустой поиск');
  }

  const hit = pickSongHit(artistName, trackTitle, parsed.data.response.hits);

  if (!hit) {
    throw new LyricsSourceError('Трек не найден на Genius');
  }

  const text = await fetchLyricsPage(hit.url);

  return { title: hit.title, text };
};
