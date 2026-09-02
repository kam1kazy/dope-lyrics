'use client';

import { useMemo } from 'react';

import { catalogQueryVariablesForSection } from '@/entities/lyric';
import { CatalogLyricsList } from '@/features/catalog-lyrics-list';
import type { CatalogSectionFilters } from '@/shared/lib/catalog-section-filters';

export function CatalogFavoritesPanel({
  filters,
}: {
  filters: CatalogSectionFilters;
}) {
  const queryVariables = useMemo(
    () => catalogQueryVariablesForSection('favorites', filters),
    [filters]
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
