'use client';

import { useMemo } from 'react';

import { catalogQueryVariablesForSection } from '@/entities/lyric';
import { CatalogLyricsList } from '@/features/catalog-lyrics-list';
import type { CatalogSectionFilters } from '@/shared/lib/catalog-section-filters';

export function CatalogDemosPanel({
  filters,
}: {
  filters: CatalogSectionFilters;
}) {
  const queryVariables = useMemo(
    () => catalogQueryVariablesForSection('demos', filters),
    [filters]
  );

  return (
    <CatalogLyricsList
      queryVariables={queryVariables}
      sortMode={filters.sortMode}
      shuffleSeed={filters.shuffleSeed}
      emptyMessage="Демок пока нет"
    />
  );
}
