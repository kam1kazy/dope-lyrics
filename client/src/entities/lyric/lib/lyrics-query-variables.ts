import type { CatalogSectionFilters } from '@/shared/lib/catalog-section-filters';
import type {
  LyricDelivery,
  LyricMood,
  LyricReadiness,
  LyricSongRole,
} from '@/shared/lib/lyric-facets';

export type LyricsQueryVariables = {
  tags: string[] | null;
  keyword: string | null;
  emojis: string[] | null;
  dateFrom: string | null;
  dateTo: string | null;
  referencesOnly: boolean | null;
  favoritesOnly: boolean | null;
  hiddenOnly: boolean | null;
  censoredOnly: boolean | null;
  includeCensored: boolean | null;
  includeShelves: string[] | null;
  excludeShelves: string[] | null;
  demoName?: string | null;
  demosOnly?: boolean | null;
  limit?: number | null;
  offset?: number | null;
  oldestFirst?: boolean | null;
  mood: LyricMood[] | null;
  delivery: LyricDelivery[] | null;
  songRole: LyricSongRole[] | null;
  readiness: LyricReadiness | null;
};

export const EMPTY_LYRIC_FACET_FILTERS = {
  mood: null,
  delivery: null,
  songRole: null,
  readiness: null,
} as const;

export const LYRICS_PAGE_SIZE = 40;

export function catalogLyricsVariables(
  overrides: Partial<LyricsQueryVariables> = {}
): LyricsQueryVariables {
  return {
    tags: null,
    keyword: null,
    emojis: null,
    dateFrom: null,
    dateTo: null,
    referencesOnly: null,
    favoritesOnly: null,
    hiddenOnly: null,
    censoredOnly: null,
    includeCensored: null,
    includeShelves: null,
    excludeShelves: null,
    demoName: null,
    demosOnly: null,
    limit: LYRICS_PAGE_SIZE,
    offset: 0,
    oldestFirst: false,
    ...EMPTY_LYRIC_FACET_FILTERS,
    ...overrides,
  };
}

export function catalogQueryVariablesForSection(
  section: 'list' | 'favorites' | 'demos',
  filters: CatalogSectionFilters,
  includeCensored = false
): LyricsQueryVariables {
  return catalogLyricsVariables({
    tags: filters.selectedTags.length > 0 ? filters.selectedTags : null,
    keyword: filters.keyword.trim() || null,
    emojis: filters.selectedEmojis.length > 0 ? filters.selectedEmojis : null,
    dateFrom: filters.dateFrom.trim() || null,
    dateTo: filters.dateTo.trim() || null,
    favoritesOnly: section === 'favorites' ? true : null,
    demosOnly: section === 'demos' ? true : null,
    oldestFirst: filters.sortMode === 'reverse',
    mood: filters.mood.length > 0 ? filters.mood : null,
    delivery: filters.delivery.length > 0 ? filters.delivery : null,
    songRole: filters.songRole.length > 0 ? filters.songRole : null,
    readiness: filters.readiness,
    includeCensored: includeCensored ? true : null,
  });
}
