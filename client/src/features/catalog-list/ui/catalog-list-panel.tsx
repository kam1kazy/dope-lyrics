'use client';

import { useMemo } from 'react';

import { catalogQueryVariablesForSection } from '@/entities/lyric';
import {
  CatalogLyricsList,
  type LyricOpenRequest,
} from '@/features/catalog-lyrics-list';
import type { CatalogSectionFilters } from '@/shared/lib/catalog-section-filters';
import { useLyricView } from '@/shared/lib/lyric-view/lyric-view-context';

export function CatalogListPanel({
  filters,
  openRequest = null,
  onOpenRequestConsumed,
}: {
  filters: CatalogSectionFilters;
  openRequest?: LyricOpenRequest | null;
  onOpenRequestConsumed?: () => void;
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
      emptyMessage="Пока ничего нет"
      openRequest={openRequest}
      onOpenRequestConsumed={onOpenRequestConsumed}
    />
  );
}
