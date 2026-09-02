'use client';

import { useMemo } from 'react';

import { catalogQueryVariablesForSection } from '@/entities/lyric';
import { CatalogLyricsList } from '@/features/catalog-lyrics-list';
import type { CatalogSectionFilters } from '@/shared/lib/catalog-section-filters';
import { useLyricView } from '@/shared/lib/lyric-view/lyric-view-context';

export function CatalogListPanel({
  filters,
}: {
  filters: CatalogSectionFilters;
}) {
  const { excludedShelves } = useLyricView();
  const queryVariables = useMemo(
    () =>
      catalogQueryVariablesForSection(
        'list',
        filters,
        !excludedShelves.includes('censored')
      ),
    [excludedShelves, filters]
  );

  return (
    <CatalogLyricsList
      queryVariables={queryVariables}
      sortMode={filters.sortMode}
      shuffleSeed={filters.shuffleSeed}
      emptyMessage="Пока ничего нет"
    />
  );
}
