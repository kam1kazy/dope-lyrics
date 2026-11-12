import { LyricsSourceError } from '~/modules/references/import-error';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_MS = 25_000;

const DARKTEXTS = 'https://darktexts.ru';
const MUSIXMATCH = 'https://www.musixmatch.com';

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/&/g, ' ')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim();

export const htmlFragmentToPlain = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ndash;/g, '–')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();

const fetchHtml = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      Referer: url.startsWith(MUSIXMATCH) ? `${MUSIXMATCH}/` : DARKTEXTS,
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
    },
    signal: AbortSignal.timeout(FETCH_MS),
  });

  if (!response.ok) {
    throw new LyricsSourceError(`HTTP ${response.status}`);
  }

  return response.text();
};

const scoreDarktextsHit = (
  artistName: string,
  trackTitle: string,
  linkTitle: string,
  href: string
): number => {
  const a = normalize(artistName);
  const t = normalize(trackTitle);
  const title = normalize(linkTitle);
  const slug = normalize(href);

  let score = 0;
  if (title.includes(t) || slug.includes(t.replace(/\s+/g, '-'))) {
    score += 4;
  }

  for (const part of a.split(/\s+/).filter((word) => word.length > 2)) {
    if (title.includes(part) || slug.includes(part)) {
      score += 2;
    }
  }

  return score;
};

const parseDarktextsSearch = (
  html: string,
  artistName: string,
  trackTitle: string
): string | null => {
  const pattern =
    /<h2 class="play-title"[\s\S]*?<a href="(https:\/\/darktexts\.ru\/\d+[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

  let best: { score: number; url: string } | null = null;

  for (const match of html.matchAll(pattern)) {
    const url = match[1] ?? '';
    const rawTitle = match[2] ?? '';
    const linkTitle = htmlFragmentToPlain(rawTitle);
    const score = scoreDarktextsHit(artistName, trackTitle, linkTitle, url);

    if (score > 0 && (!best || score > best.score)) {
      best = { score, url };
    }
  }

  return best && best.score >= 4 ? best.url : null;
};

const parseDarktextsPage = (html: string): string => {
  const match = html.match(
    /id="s-desc"[^>]*>([\s\S]*?)<\/div>\s*<div class="margin20">/
  );

  if (!match?.[1]) {
    throw new LyricsSourceError('DarkTexts: нет блока текста');
  }

  const text = htmlFragmentToPlain(match[1]);
  if (text.length < 40) {
    throw new LyricsSourceError('DarkTexts: короткий текст');
  }

  return text;
};

export const fetchTrackLyricsFromDarktexts = async (
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string }> => {
  const query = `${artistName} ${trackTitle}`.trim();
  const searchUrl = `${DARKTEXTS}/index.php?do=search&subaction=search&story=${encodeURIComponent(query)}`;
  const searchHtml = await fetchHtml(searchUrl);
  const pageUrl = parseDarktextsSearch(searchHtml, artistName, trackTitle);

  if (!pageUrl) {
    throw new LyricsSourceError('DarkTexts: нет совпадения в поиске');
  }

  const pageHtml = await fetchHtml(pageUrl);
  const text = parseDarktextsPage(pageHtml);

  return { title: trackTitle, text };
};

const extractNextData = (html: string): unknown => {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );

  if (!match?.[1]) {
    throw new LyricsSourceError('Musixmatch: нет данных страницы');
  }

  try {
    return JSON.parse(match[1]) as unknown;
  } catch {
    throw new LyricsSourceError('Musixmatch: битый JSON');
  }
};

const lyricsFromMusixmatchDoc = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const record = data as Record<string, unknown>;
  const trackInfo = record.trackInfo;

  if (!trackInfo || typeof trackInfo !== 'object') {
    return null;
  }

  const infoData = (trackInfo as Record<string, unknown>).data;
  if (!infoData || typeof infoData !== 'object') {
    return null;
  }

  const lyrics = (infoData as Record<string, unknown>).lyrics;
  if (!lyrics || typeof lyrics !== 'object') {
    return null;
  }

  const body = (lyrics as Record<string, unknown>).body;
  return typeof body === 'string' && body.trim().length >= 40
    ? body.trim()
    : null;
};

const trackTitleFromMusixmatchDoc = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const trackInfo = (data as Record<string, unknown>).trackInfo;
  if (!trackInfo || typeof trackInfo !== 'object') {
    return null;
  }

  const infoData = (trackInfo as Record<string, unknown>).data;
  if (!infoData || typeof infoData !== 'object') {
    return null;
  }

  const track = (infoData as Record<string, unknown>).track;
  if (!track || typeof track !== 'object') {
    return null;
  }

  const name = (track as Record<string, unknown>).track_name;
  return typeof name === 'string' ? name : null;
};

const toMusixmatchArtistSlug = (artistName: string): string =>
  artistName
    .replace(/\s*&\s*/gi, '-feat-')
    .replace(/\s+/g, '-')
    .replace(/\bOG\b/gi, 'Og')
    .replace(/-+/g, '-');

const musixmatchUrlVariants = (
  artistName: string,
  trackTitle: string
): string[] => {
  const artists = [
    toMusixmatchArtistSlug(artistName),
    artistName,
    artistName.replace(/\s*&\s*/gi, ' feat. '),
  ];

  const seen = new Set<string>();
  const urls: string[] = [];

  for (const artist of artists) {
    const path = `/lyrics/${encodeURIComponent(artist)}/${encodeURIComponent(trackTitle)}`;
    if (seen.has(path)) {
      continue;
    }

    seen.add(path);
    urls.push(`${MUSIXMATCH}${path}`);
  }

  return urls;
};

export const fetchTrackLyricsFromMusixmatch = async (
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string }> => {
  let lastError: LyricsSourceError | null = null;

  for (const url of musixmatchUrlVariants(artistName, trackTitle)) {
    try {
      const html = await fetchHtml(url);
      const next = extractNextData(html);
      const pageProps = (next as Record<string, unknown>)?.props as
        Record<string, unknown> | undefined;
      const data = pageProps?.pageProps as Record<string, unknown> | undefined;
      const pageData = data?.data;

      const text = lyricsFromMusixmatchDoc(pageData);
      if (!text) {
        throw new LyricsSourceError('Musixmatch: пустой текст');
      }

      const title = trackTitleFromMusixmatchDoc(pageData) ?? trackTitle;
      return { title, text };
    } catch (error: unknown) {
      lastError =
        error instanceof LyricsSourceError
          ? error
          : new LyricsSourceError('Musixmatch: ошибка загрузки');
    }
  }

  throw lastError ?? new LyricsSourceError('Musixmatch: трек не найден');
};
