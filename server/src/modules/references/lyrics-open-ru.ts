import { LyricsSourceError } from '~/modules/references/import-error';
import { htmlFragmentToPlain } from '~/modules/references/lyrics-regional';
import {
  normalizeKey,
  translitSlug,
  txtsongArtistCandidates,
} from '~/modules/references/slug-translit';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_MS = 25_000;

const VSE_PESNI = 'https://vse-pesni.com';
const PESENKOV = 'https://pesenkov.ru';
const TEXTLYRIK = 'https://textlyrik.ru';

const fetchHtml = async (url: string, referer: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'ru-RU,ru;q=0.9',
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
    html.includes('нажмите на похожий цвет')
  ) {
    throw new LyricsSourceError('Сайт отклонил запрос (антибот)');
  }

  return html;
};

const plainEnough = (html: string): string => {
  const text = htmlFragmentToPlain(html);
  if (text.length < 40) {
    throw new LyricsSourceError('Короткий текст');
  }

  return text;
};

export const parseVsePesniPage = (html: string): string => {
  const match = html.match(/class="can_copy">([\s\S]*?)<\/div>/i);
  if (!match?.[1]) {
    throw new LyricsSourceError('vse-pesni: нет блока текста');
  }

  return plainEnough(match[1]);
};

export const parsePesenkovPage = (html: string): string => {
  const match = html.match(/class="song-page-lyrics-text">([\s\S]*?)<\/div>/i);
  if (!match?.[1]) {
    throw new LyricsSourceError('pesenkov: нет блока текста');
  }

  return plainEnough(match[1]);
};

export const parseTextlyrikPage = (html: string): string => {
  const match = html.match(
    /<div class="post_content cf"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i
  );
  if (!match?.[1]) {
    throw new LyricsSourceError('textlyrik: нет блока текста');
  }

  return plainEnough(match[1]);
};

const titleMatches = (label: string, trackTitle: string): boolean => {
  const wanted = normalizeKey(trackTitle);
  const got = normalizeKey(label);
  if (!wanted || !got) {
    return false;
  }

  if (got.includes(wanted) || wanted.includes(got)) {
    return true;
  }

  const parts = wanted.split(' ').filter((part) => part.length > 2);
  return parts.length > 0 && parts.every((part) => got.includes(part));
};

const hyphenSlug = (value: string): string =>
  value
    .split(/[^a-zA-Zа-яА-ЯёЁ0-9]+/)
    .filter(Boolean)
    .map((word) => translitSlug(word))
    .filter(Boolean)
    .join('-');

const artistSlugs = (artistName: string): string[] => {
  const dotted = artistName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]+/g, '')
    .replace(/^-+|-+$/g, '');

  return [
    ...new Set(
      [
        hyphenSlug(artistName),
        dotted,
        ...txtsongArtistCandidates(artistName),
      ].filter((slug) => slug.length >= 2 && !slug.startsWith('-'))
    ),
  ];
};

const titleFromDash = (label: string): string => {
  const parts = htmlFragmentToPlain(label).split(/\s[-–—]\s/);
  return (parts.length > 1 ? parts[parts.length - 1] : (parts[0] ?? '')).trim();
};

export const fetchOpenCatalogTitles = async (
  artistName: string,
  limit: number
): Promise<string[]> => {
  const titles: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string) => {
    const title = titleFromDash(raw);
    const key = normalizeKey(title);
    if (title.length < 2 || key === 'подробнее' || seen.has(key)) {
      return;
    }

    seen.add(key);
    titles.push(title);
  };

  for (const slug of artistSlugs(artistName)) {
    const before = titles.length;

    try {
      const html = await fetchHtml(`${PESENKOV}/artists/${slug}`, PESENKOV);
      for (const match of html.matchAll(
        /class="artist-page-song-title"[^>]*>([\s\S]*?)<\/span>/gi
      )) {
        push(match[1] ?? '');
        if (titles.length >= limit) {
          return titles;
        }
      }
    } catch {
      // нет карточки
    }

    try {
      const html = await fetchHtml(`${TEXTLYRIK}/artist/${slug}`, TEXTLYRIK);
      for (const match of html.matchAll(
        /<a href="https:\/\/textlyrik\.ru\/\d+-[^"]+"[^>]*>([\s\S]*?)<\/a>/gi
      )) {
        push(match[1] ?? '');
        if (titles.length >= limit) {
          return titles;
        }
      }
    } catch {
      // нет карточки
    }

    if (titles.length > before) {
      return titles.slice(0, limit);
    }
  }

  if (titles.length === 0) {
    throw new LyricsSourceError('Нет списка в открытых каталогах');
  }

  return titles.slice(0, limit);
};

const fetchVsePesni = async (
  artistName: string,
  trackTitle: string
): Promise<string> => {
  const searchUrl = `${VSE_PESNI}/?s=${encodeURIComponent(`${artistName} ${trackTitle}`)}`;
  const html = await fetchHtml(searchUrl, VSE_PESNI);
  let best: string | null = null;

  for (const match of html.matchAll(
    /href="(https:\/\/vse-pesni\.com\/song\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  )) {
    const url = match[1] ?? '';
    const label = htmlFragmentToPlain(match[2] ?? '');
    if (
      titleMatches(label, trackTitle) &&
      titleMatches(label, artistName.split(' ')[0] ?? artistName)
    ) {
      best = url;
      break;
    }
  }

  if (!best) {
    throw new LyricsSourceError('vse-pesni: нет ссылки');
  }

  const page = await fetchHtml(best, searchUrl);
  return parseVsePesniPage(page);
};

const fetchPesenkov = async (
  artistName: string,
  trackTitle: string
): Promise<string> => {
  for (const slug of artistSlugs(artistName)) {
    let html: string;
    try {
      html = await fetchHtml(`${PESENKOV}/artists/${slug}`, PESENKOV);
    } catch {
      continue;
    }

    for (const match of html.matchAll(
      /href="(https:\/\/pesenkov\.ru\/artists\/[^"]+\/songs\/[^"]+)"[\s\S]*?class="artist-page-song-title"[^>]*>([\s\S]*?)<\/span>/gi
    )) {
      const label = htmlFragmentToPlain(match[2] ?? '');
      if (!titleMatches(label, trackTitle)) {
        continue;
      }

      const page = await fetchHtml(match[1] ?? '', PESENKOV);
      return parsePesenkovPage(page);
    }
  }

  throw new LyricsSourceError('pesenkov: текст не найден');
};

const fetchTextlyrik = async (
  artistName: string,
  trackTitle: string
): Promise<string> => {
  for (const slug of artistSlugs(artistName)) {
    let html: string;
    try {
      html = await fetchHtml(`${TEXTLYRIK}/artist/${slug}`, TEXTLYRIK);
    } catch {
      continue;
    }

    for (const match of html.matchAll(
      /<a href="(https:\/\/textlyrik\.ru\/\d+-[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    )) {
      const label = htmlFragmentToPlain(match[2] ?? '');
      if (!titleMatches(label, trackTitle)) {
        continue;
      }

      const page = await fetchHtml(match[1] ?? '', TEXTLYRIK);
      return parseTextlyrikPage(page);
    }
  }

  throw new LyricsSourceError('textlyrik: текст не найден');
};

export const fetchTrackLyricsFromOpenRu = async (
  artistName: string,
  trackTitle: string
): Promise<{ title: string; text: string }> => {
  const attempts = [
    () => fetchPesenkov(artistName, trackTitle),
    () => fetchVsePesni(artistName, trackTitle),
    () => fetchTextlyrik(artistName, trackTitle),
  ];

  let last: LyricsSourceError | null = null;
  for (const attempt of attempts) {
    try {
      const text = await attempt();
      return { title: trackTitle, text };
    } catch (error: unknown) {
      last =
        error instanceof LyricsSourceError
          ? error
          : new LyricsSourceError('Открытый каталог: ошибка');
    }
  }

  throw last ?? new LyricsSourceError('Открытый каталог: текст не найден');
};
