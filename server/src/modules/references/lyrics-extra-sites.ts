import { LyricsSourceError } from '~/modules/references/import-error';
import { htmlFragmentToPlain } from '~/modules/references/lyrics-regional';
import {
  azlyricsArtistCandidates,
  azlyricsCompact,
  normalizeKey,
  trackSlug,
  txtsongArtistCandidates,
} from '~/modules/references/slug-translit';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_MS = 25_000;
const TXTSONG = 'https://txtsong.ru';
const LYRICSIFY = 'https://www.lyricsify.com';
const AZLYRICS = 'https://www.azlyrics.com';

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
    html.includes('request has been denied') ||
    html.includes('Ваш запрос был отклонен') ||
    html.includes('нажмите на похожий цвет') ||
    html.includes('cf-browser-verification') ||
    html.includes('Just a moment') ||
    (html.includes('noarchive, noai') && !html.includes('song-text'))
  ) {
    throw new LyricsSourceError('Сайт отклонил запрос (антибот)');
  }

  return html;
};

type TxtsongLink = { url: string; label: string };

const scoreTxtsongHit = (
  artistName: string,
  trackTitle: string,
  link: TxtsongLink
): number => {
  const a = normalizeKey(artistName);
  const t = normalizeKey(trackTitle);
  const title = normalizeKey(link.label);
  const slug = normalizeKey(link.url);
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

/** Ссылки с каталога артиста вида `https://txtsong.ru/sted-d/sted-d-track/`. */
export const parseTxtsongCatalogLinks = (
  html: string,
  artistSlug: string
): TxtsongLink[] => {
  const escaped = artistSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `href="((?:https:\\/\\/txtsong\\.ru)?\\/${escaped}\\/${escaped}-[^"?#]+/?)"[^>]*>([\\s\\S]*?)<\\/a>`,
    'gi'
  );
  const links: TxtsongLink[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(pattern)) {
    const rawHref = match[1] ?? '';
    const href = rawHref.startsWith('http')
      ? rawHref
      : `${TXTSONG}${rawHref.startsWith('/') ? '' : '/'}${rawHref}`;
    const label = htmlFragmentToPlain(match[2] ?? '');
    const normalized = href.replace(/\/$/, '') + '/';
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    links.push({ url: normalized, label: label || normalized });
  }

  return links;
};

const pickTxtsongUrl = (
  links: TxtsongLink[],
  artistName: string,
  trackTitle: string
): string | null => {
  let best: { score: number; url: string } | null = null;

  for (const link of links) {
    const score = scoreTxtsongHit(artistName, trackTitle, link);
    if (score > 0 && (!best || score > best.score)) {
      best = { score, url: link.url };
    }
  }

  return best && best.score >= 4 ? best.url : null;
};

const fetchTxtsongFromCatalog = async (
  artistSlug: string,
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string } | null> => {
  const catalogUrl = `${TXTSONG}/${artistSlug}/`;
  const html = await fetchHtml(catalogUrl, 'https://www.google.com/');
  const url = pickTxtsongUrl(
    parseTxtsongCatalogLinks(html, artistSlug),
    artistName,
    trackTitle
  );

  if (!url) {
    return null;
  }

  const page = await fetchHtml(url, catalogUrl);
  const text = parseTxtsongPage(page);
  return { title: trackTitle, text };
};

const parseLyricsBlock = (html: string, patterns: RegExp[]): string => {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const text = htmlFragmentToPlain(match[1]);
    if (text.length >= 40) {
      return text;
    }
  }

  throw new LyricsSourceError('Блок текста не найден');
};

const parseTxtsongPage = (html: string): string =>
  parseLyricsBlock(html, [
    /class="[^"]*song-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /itemprop="description"[^>]*>([\s\S]*?)<\/div>/i,
  ]);

const parseLyricsifyPage = (html: string): string => {
  const plain = parseLyricsBlock(html, [
    /id="lyrics"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*lyric[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<pre[^>]*>([\s\S]*?)<\/pre>/i,
  ]);

  return plain.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim();
};

export const parseAzlyricsPage = (html: string): string => {
  const marker = '<!-- Usage of azlyrics.com content';
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) {
    throw new LyricsSourceError('AZLyrics: не страница с текстом');
  }

  const endIdx = html.indexOf('<!-- MxM master song listing -->', startIdx);
  const chunk =
    endIdx === -1 ? html.slice(startIdx) : html.slice(startIdx, endIdx);

  const divMatch = chunk.match(/<div>([\s\S]*?)<\/div>/i);
  if (!divMatch?.[1]) {
    throw new LyricsSourceError('AZLyrics: пустой блок');
  }

  const text = htmlFragmentToPlain(divMatch[1]);
  if (text.length < 40) {
    throw new LyricsSourceError('AZLyrics: короткий текст');
  }

  return text;
};

const txtsongDirectUrls = (
  artistSlug: string,
  trackTitle: string
): string[] => {
  const track = trackSlug(trackTitle);
  const direct = `${TXTSONG}/${artistSlug}/${artistSlug}-${track}/`;

  return [direct];
};

export const fetchTrackLyricsFromTxtsong = async (
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string }> => {
  let lastError: LyricsSourceError | null = null;

  for (const artistSlug of txtsongArtistCandidates(artistName)) {
    try {
      const fromCatalog = await fetchTxtsongFromCatalog(
        artistSlug,
        artistName,
        trackTitle
      );
      if (fromCatalog) {
        return fromCatalog;
      }
    } catch (error: unknown) {
      lastError =
        error instanceof LyricsSourceError
          ? error
          : new LyricsSourceError('TXTsong: ошибка каталога');
    }

    for (const url of txtsongDirectUrls(artistSlug, trackTitle)) {
      try {
        const html = await fetchHtml(url, 'https://www.google.com/');
        const text = parseTxtsongPage(html);
        return { title: trackTitle, text };
      } catch (error: unknown) {
        lastError =
          error instanceof LyricsSourceError
            ? error
            : new LyricsSourceError('TXTsong: ошибка');
      }
    }
  }

  const searchUrl = `${TXTSONG}/?s=${encodeURIComponent(`${artistName} ${trackTitle}`)}`;
  try {
    const html = await fetchHtml(searchUrl, 'https://www.google.com/');
    const trackNeedle = trackSlug(trackTitle);
    const link = html.match(
      new RegExp(
        `href="(${TXTSONG.replace(/\./g, '\\.')}/[^"]+${trackNeedle}[^"]*/?)"`,
        'i'
      )
    )?.[1];

    if (link) {
      const page = await fetchHtml(link, TXTSONG);
      const text = parseTxtsongPage(page);
      return { title: trackTitle, text };
    }
  } catch (error: unknown) {
    lastError =
      error instanceof LyricsSourceError
        ? error
        : new LyricsSourceError('TXTsong: поиск не удался');
  }

  throw lastError ?? new LyricsSourceError('TXTsong: текст не найден');
};

export const fetchTrackLyricsFromLyricsify = async (
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string }> => {
  const artist = siteArtistSlug(artistName, 'lyricsify');
  const track = trackSlug(trackTitle);
  const url = `${LYRICSIFY}/lyrics/${artist}/${track}`;
  const html = await fetchHtml(url, 'https://www.google.com/');
  const text = parseLyricsifyPage(html);

  return { title: trackTitle, text };
};

export const fetchTrackLyricsFromAzlyrics = async (
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string }> => {
  const track = azlyricsCompact(trackTitle);
  let lastError: LyricsSourceError | null = null;

  for (const artist of azlyricsArtistCandidates(artistName)) {
    const url = `${AZLYRICS}/lyrics/${artist}/${track}.html`;

    try {
      const html = await fetchHtml(url, 'https://www.google.com/');
      const text = parseAzlyricsPage(html);
      return { title: trackTitle, text };
    } catch (error: unknown) {
      lastError =
        error instanceof LyricsSourceError
          ? error
          : new LyricsSourceError('AZLyrics: ошибка');
    }
  }

  throw lastError ?? new LyricsSourceError('AZLyrics: трек не найден');
};
