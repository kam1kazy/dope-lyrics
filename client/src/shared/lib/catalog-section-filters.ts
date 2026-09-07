import type {
  LyricDelivery,
  LyricEnergy,
  LyricMood,
  LyricReadiness,
  LyricSongRole,
  LyricSource,
} from '@/shared/lib/lyric-facets';
import type { SortMode } from '@/shared/lib/lyric-view/lyric-view-context';
import {
  DEFAULT_EXCLUDED_SHELVES,
  type ShelfFlag,
} from '@/shared/lib/lyric-view/shelf-filter';

export type CatalogSectionFilters = {
  sortMode: SortMode;
  shuffleSeed: number;
  selectedTags: string[];
  selectedEmojis: string[];
  keyword: string;
  dateFrom: string;
  dateTo: string;
  includeShelves: ShelfFlag[];
  excludeShelves: ShelfFlag[];
  selectedSources: LyricSource[];
  mood: LyricMood[];
  excludeMood: LyricMood[];
  delivery: LyricDelivery[];
  excludeDelivery: LyricDelivery[];
  songRole: LyricSongRole[];
  excludeSongRole: LyricSongRole[];
  readiness: LyricReadiness[];
  excludeReadiness: LyricReadiness[];
  energy: LyricEnergy[];
  excludeEnergy: LyricEnergy[];
};

const sameList = (
  left: readonly string[],
  right: readonly string[]
): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  const a = [...left].sort();
  const b = [...right].sort();

  return a.every((value, index) => value === b[index]);
};

export const DEFAULT_CATALOG_SECTION_FILTERS: CatalogSectionFilters = {
  sortMode: 'forward',
  shuffleSeed: 1,
  selectedTags: [],
  selectedEmojis: [],
  keyword: '',
  dateFrom: '',
  dateTo: '',
  includeShelves: [],
  excludeShelves: [],
  selectedSources: [],
  mood: [],
  excludeMood: [],
  delivery: [],
  excludeDelivery: [],
  songRole: [],
  excludeSongRole: [],
  readiness: [],
  excludeReadiness: [],
  energy: [],
  excludeEnergy: [],
};

export const DEFAULT_LIST_SECTION_FILTERS: CatalogSectionFilters = {
  ...DEFAULT_CATALOG_SECTION_FILTERS,
  sortMode: 'forward',
  excludeShelves: [...DEFAULT_EXCLUDED_SHELVES],
};

export const DEFAULT_GENERATOR_SECTION_FILTERS: CatalogSectionFilters = {
  ...DEFAULT_CATALOG_SECTION_FILTERS,
  excludeShelves: [...DEFAULT_EXCLUDED_SHELVES],
};

export function hasActiveCatalogSectionFilters(
  filters: CatalogSectionFilters,
  defaults: CatalogSectionFilters = DEFAULT_CATALOG_SECTION_FILTERS
): boolean {
  return (
    filters.sortMode !== defaults.sortMode ||
    filters.selectedTags.length > 0 ||
    filters.selectedEmojis.length > 0 ||
    filters.keyword.trim().length > 0 ||
    filters.dateFrom.trim().length > 0 ||
    filters.dateTo.trim().length > 0 ||
    !sameList(filters.includeShelves, defaults.includeShelves) ||
    !sameList(filters.excludeShelves, defaults.excludeShelves) ||
    !sameList(filters.selectedSources, defaults.selectedSources) ||
    filters.mood.length > 0 ||
    filters.excludeMood.length > 0 ||
    filters.delivery.length > 0 ||
    filters.excludeDelivery.length > 0 ||
    filters.songRole.length > 0 ||
    filters.excludeSongRole.length > 0 ||
    filters.readiness.length > 0 ||
    filters.excludeReadiness.length > 0 ||
    filters.energy.length > 0 ||
    filters.excludeEnergy.length > 0
  );
}
