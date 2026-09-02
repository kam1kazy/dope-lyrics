import type {
  LyricDelivery,
  LyricMood,
  LyricReadiness,
  LyricSongRole,
} from '@/shared/lib/lyric-facets';
import type { SortMode } from '@/shared/lib/lyric-view/lyric-view-context';

export type CatalogSectionFilters = {
  sortMode: SortMode;
  shuffleSeed: number;
  selectedTags: string[];
  selectedEmojis: string[];
  keyword: string;
  dateFrom: string;
  dateTo: string;
  mood: LyricMood[];
  excludeMood: LyricMood[];
  delivery: LyricDelivery[];
  excludeDelivery: LyricDelivery[];
  songRole: LyricSongRole[];
  excludeSongRole: LyricSongRole[];
  readiness: LyricReadiness[];
  excludeReadiness: LyricReadiness[];
};

export const DEFAULT_CATALOG_SECTION_FILTERS: CatalogSectionFilters = {
  sortMode: 'forward',
  shuffleSeed: 1,
  selectedTags: [],
  selectedEmojis: [],
  keyword: '',
  dateFrom: '',
  dateTo: '',
  mood: [],
  excludeMood: [],
  delivery: [],
  excludeDelivery: [],
  songRole: [],
  excludeSongRole: [],
  readiness: [],
  excludeReadiness: [],
};

export function hasActiveCatalogSectionFilters(
  filters: CatalogSectionFilters
): boolean {
  return (
    filters.sortMode !== DEFAULT_CATALOG_SECTION_FILTERS.sortMode ||
    filters.selectedTags.length > 0 ||
    filters.selectedEmojis.length > 0 ||
    filters.keyword.trim().length > 0 ||
    filters.dateFrom.trim().length > 0 ||
    filters.dateTo.trim().length > 0 ||
    filters.mood.length > 0 ||
    filters.excludeMood.length > 0 ||
    filters.delivery.length > 0 ||
    filters.excludeDelivery.length > 0 ||
    filters.songRole.length > 0 ||
    filters.excludeSongRole.length > 0 ||
    filters.readiness.length > 0 ||
    filters.excludeReadiness.length > 0
  );
}
