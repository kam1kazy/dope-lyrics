import { LyricsSourceError } from '~/modules/references/import-error';
import { htmlFragmentToPlain } from '~/modules/references/lyrics-regional';
import {
  normalizeKey,
  SITE_ARTIST_SLUGS,
  siteArtistSlug,
  trackSlug,
} from '~/modules/references/slug-translit';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_MS = 25_000;

const TEXT_LYRICS = 'https://text-lyrics.ru';
const RAP_RUSSIA = 'https://rap-russia.ru';

const catalogArtistSlug = (artistName: string): string => {
  const fromSite = siteArtistSlug(artistName, 'txtsong');
  const latin = (artistName.match(/[a-zA-Z0-9]+/g) ?? [])
    .map((part) => part.toLowerCase())
    .join('-');
  if (latin.length >= 2 && latin === fromSite) {
    return latin;
  }

  if (SITE_ARTIST_SLUGS[normalizeKey(artistName)]?.txtsong) {
    return fromSite;
  }

  if (latin.length >= 2) {
    return latin;
  }

  return fromSite;
};

const scoreHit = (
  artistName: string,
  trackTitle: string,
  linkLabel: string,
  href: string
): number => {
  const a = normalizeKey(artistName);
  const t = normalizeKey(trackTitle);
  const title = normalizeKey(linkLabel);
  const slug = normalizeKey(href);
  const trackCompact = t.replace(/\s+/g, '');
  const slugCompact = slug.replace(/[^a-z0-9]+/g, '');

  let score = 0;
  if (
    title.includes(t) ||
    slug.includes(t) ||
    slugCompact.includes(trackCompact)
  ) {
    score += 4;
  } else if (
    trackSlug(trackTitle)
      .split('-')
      .filter((part) => part.length > 2)
      .some((part) => slug.includes(part))
  ) {
    score += 3;
  }

  for (const part of a.split(/\s+/).filter((word) => word.length > 2)) {
    if (title.includes(part) || slug.includes(part)) {
      score += 2;
    }
  }

  return score;
};

const fetchHtml = async (url: string, referer: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      Referer: referer,
    },
    signal: AbortSignal.timeout(FETCH_MS),
  });

  if (!response.ok) {
    throw new LyricsSourceError(`HTTP ${response.status}`);
  }

  const html = await response.text();
  if (
    html.includes('Just a moment') ||
    html.includes('cf-browser-verification') ||
    html.includes('request has been denied')
  ) {
    throw new LyricsSourceError('Сайт отклонил запрос (антибот)');
  }

  return html;
};

export const parseTextLyricsPage = (html: string): string => {
  const match = html.match(
    /id="entry_content"[^>]*>([\s\S]*?)(?:<div id="fixed_cblock"|<div id="spec1"|<aside class="ads)/
  );

  if (!match?.[1]) {
    throw new LyricsSourceError('text-lyrics.ru: нет блока текста');
  }

  const text = htmlFragmentToPlain(match[1]);
  if (text.length < 40) {
    throw new LyricsSourceError('text-lyrics.ru: короткий текст');
  }

  return text;
};

export const parseRapRussiaPage = (html: string): string => {
  const match = html.match(
    /<div class="lyrics-body">([\s\S]*?)<\/div>\s*<a[^>]*class="[^"]*rr-ad-slot"/
  );
  const chunk =
    match?.[1] ?? html.match(/<div class="lyrics-body">([\s\S]*?)<\/div>/)?.[1];

  if (!chunk) {
    throw new LyricsSourceError('rap-russia.ru: нет блока текста');
  }

  const withoutAds = chunk.replace(/<aside[\s\S]*$/i, '');
  const text = htmlFragmentToPlain(withoutAds);
  if (text.length < 40) {
    throw new LyricsSourceError('rap-russia.ru: короткий текст');
  }

  return text;
};

type SongLink = { url: string; label: string };

const parseTextLyricsCatalog = (html: string): SongLink[] => {
  const pattern =
    /href="(https:\/\/text-lyrics\.ru\/p\/[^"]+-text-pesni\.html)"/gi;
  const links: SongLink[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(pattern)) {
    const url = match[1] ?? '';
    if (!url || seen.has(url)) {
      continue;
    }

    seen.add(url);
    const slug = url.split('/').pop() ?? '';
    links.push({ url, label: slug.replace(/-text-pesni\.html$/i, '') });
  }

  return links;
};

const parseRapRussiaListing = (html: string): SongLink[] => {
  const pattern =
    /<h2><a href="(https:\/\/rap-russia\.ru\/publ\/[^"]+)">([\s\S]*?)<\/a><\/h2>/gi;
  const links: SongLink[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(pattern)) {
    const url = match[1] ?? '';
    const rawLabel = match[2] ?? '';
    if (!url || seen.has(url)) {
      continue;
    }

    seen.add(url);
    links.push({ url, label: htmlFragmentToPlain(rawLabel) });
  }

  return links;
};

const pickBestUrl = (
  links: SongLink[],
  artistName: string,
  trackTitle: string
): string | null => {
  let best: { score: number; url: string } | null = null;

  for (const link of links) {
    const score = scoreHit(artistName, trackTitle, link.label, link.url);
    if (score > 0 && (!best || score > best.score)) {
      best = { score, url: link.url };
    }
  }

  return best && best.score >= 4 ? best.url : null;
};

const loadSongFromCatalog = async (
  catalogUrl: string,
  parseListing: (html: string) => SongLink[],
  parsePage: (html: string) => string,
  artistName: string,
  trackTitle: string,
  referer: string
): Promise<{ title: string; text: string } | null> => {
  const catalog = await fetchHtml(catalogUrl, referer);
  const url = pickBestUrl(parseListing(catalog), artistName, trackTitle);
  if (!url) {
    return null;
  }

  const page = await fetchHtml(url, catalogUrl);
  const text = parsePage(page);
  return { title: trackTitle, text };
};

export const fetchTrackLyricsFromTextLyrics = async (
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string }> => {
  const slug = catalogArtistSlug(artistName);
  const catalogUrl = `${TEXT_LYRICS}/p/${slug}/`;

  try {
    const fromCatalog = await loadSongFromCatalog(
      catalogUrl,
      parseTextLyricsCatalog,
      parseTextLyricsPage,
      artistName,
      trackTitle,
      TEXT_LYRICS
    );
    if (fromCatalog) {
      return fromCatalog;
    }
  } catch (error) {
    if (
      error instanceof LyricsSourceError &&
      error.message.startsWith('HTTP 404')
    ) {
      // нет раздела артиста
    } else {
      throw error;
    }
  }

  throw new LyricsSourceError('text-lyrics.ru: текст не найден');
};

export const fetchTrackLyricsFromRapRussia = async (
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string }> => {
  const slug = catalogArtistSlug(artistName);
  const catalogUrl = `${RAP_RUSSIA}/lyrics/artist/${slug}/`;

  try {
    const fromCatalog = await loadSongFromCatalog(
      catalogUrl,
      parseRapRussiaListing,
      parseRapRussiaPage,
      artistName,
      trackTitle,
      RAP_RUSSIA
    );
    if (fromCatalog) {
      return fromCatalog;
    }
  } catch (error) {
    if (
      error instanceof LyricsSourceError &&
      error.message.startsWith('HTTP 404')
    ) {
      // нет карточки артиста
    } else {
      throw error;
    }
  }

  const searchUrl = `${RAP_RUSSIA}/?s=${encodeURIComponent(
    `${artistName} ${trackTitle}`
  )}`;
  const searchHtml = await fetchHtml(searchUrl, RAP_RUSSIA);
  const url = pickBestUrl(
    parseRapRussiaListing(searchHtml),
    artistName,
    trackTitle
  );

  if (!url) {
    throw new LyricsSourceError('rap-russia.ru: текст не найден');
  }

  const page = await fetchHtml(url, searchUrl);
  const text = parseRapRussiaPage(page);
  return { title: trackTitle, text };
};

const titleFromCatalogLabel = (label: string): string => {
  const cleaned = label
    .replace(/\(текст песни\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = cleaned.split(/\s[-–—]\s/);
  return (parts.length > 1 ? parts[parts.length - 1] : cleaned).trim();
};

/** Названия с каталога артиста, когда у Deezer нет топа. */
export const fetchCatalogTrackTitles = async (
  artistName: string,
  limit: number
): Promise<string[]> => {
  const slug = catalogArtistSlug(artistName);
  const titles: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string) => {
    const title = titleFromCatalogLabel(htmlFragmentToPlain(raw));
    const key = normalizeKey(title);
    if (title.length < 2 || seen.has(key)) {
      return;
    }

    seen.add(key);
    titles.push(title);
  };

  try {
    const html = await fetchHtml(`${TEXT_LYRICS}/p/${slug}/`, TEXT_LYRICS);
    for (const match of html.matchAll(
      /<div class="text-top">[\s\S]*?<span>([\s\S]*?)<\/span>/gi
    )) {
      push(match[1] ?? '');
      if (titles.length >= limit) {
        return titles;
      }
    }
  } catch (error) {
    if (
      !(error instanceof LyricsSourceError) ||
      !error.message.startsWith('HTTP 404')
    ) {
      // каталог необязателен
    }
  }

  try {
    const html = await fetchHtml(
      `${RAP_RUSSIA}/lyrics/artist/${slug}/`,
      RAP_RUSSIA
    );
    for (const match of html.matchAll(
      /<h2><a href="https:\/\/rap-russia\.ru\/publ\/[^"]+">([\s\S]*?)<\/a><\/h2>/gi
    )) {
      push(match[1] ?? '');
      if (titles.length >= limit) {
        return titles;
      }
    }
  } catch {
    // нет карточки
  }

  if (titles.length === 0) {
    throw new LyricsSourceError('Нет списка треков в каталогах');
  }

  return titles;
};
