const TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

export const normalizeKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/&/g, ' ')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim();

export const translitSlug = (value: string): string => {
  const chars = [...value.toLowerCase()];
  const out = chars.map((char) => {
    if (/[a-z0-9]/.test(char)) {
      return char;
    }

    return TRANSLIT[char] ?? '';
  });

  return out
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

/** Узнаваемые на сайтах написания (иначе — translitSlug). */
export const SITE_ARTIST_SLUGS: Record<
  string,
  { txtsong?: string; azlyrics?: string; lyricsify?: string }
> = {
  [normalizeKey('Сидоджи Дубоshit')]: {
    txtsong: 'sidodgi-duboshit',
    azlyrics: 'sidshit',
    lyricsify: 'sidodgi-duboshit',
  },
  [normalizeKey('Сидоджи Дубошит')]: {
    txtsong: 'sidodgi-duboshit',
    azlyrics: 'sidshit',
    lyricsify: 'sidodgi-duboshit',
  },
  [normalizeKey('STED.D')]: {
    txtsong: 'sted-d',
  },
};

export const siteArtistSlug = (
  artistName: string,
  site: 'txtsong' | 'azlyrics' | 'lyricsify'
): string => {
  const key = normalizeKey(artistName);
  const override = SITE_ARTIST_SLUGS[key]?.[site];
  if (override) {
    return override;
  }

  return translitSlug(artistName);
};

export const trackSlug = (trackTitle: string): string =>
  translitSlug(trackTitle);

export const azlyricsCompact = (trackTitle: string): string =>
  trackTitle.toLowerCase().replace(/[^a-z0-9]/gi, '');

export const txtsongArtistCandidates = (artistName: string): string[] => {
  const key = normalizeKey(artistName);
  const override = SITE_ARTIST_SLUGS[key]?.txtsong;
  const fromTranslit = translitSlug(artistName);
  const latinParts = (artistName.match(/[a-zA-Z0-9]+/g) ?? []).map((part) =>
    part.toLowerCase()
  );
  const latinHyphen =
    latinParts.length > 1 ? latinParts.join('-') : (latinParts[0] ?? '');

  const candidates = [
    override,
    fromTranslit,
    latinHyphen.length >= 2 && latinHyphen !== fromTranslit
      ? latinHyphen
      : null,
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates)];
};

export const azlyricsArtistCandidates = (artistName: string): string[] => {
  const key = normalizeKey(artistName);
  const override = SITE_ARTIST_SLUGS[key]?.azlyrics;
  const latin = (artistName.match(/[a-zA-Z]+/g) ?? [])
    .map((part) => part.toLowerCase())
    .join('');

  const candidates = [
    override,
    latin.length >= 3 ? latin : null,
    translitSlug(artistName).replace(/-/g, ''),
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates)];
};
