'use client';

import { ArrowDownAZ, ArrowUpAZ, RotateCcw, Shuffle } from 'lucide-react';

import { LyricFilterFields } from '@/features/filter-panel';
import {
  type CatalogSectionFilters,
  DEFAULT_CATALOG_SECTION_FILTERS,
  hasActiveCatalogSectionFilters,
} from '@/shared/lib/catalog-section-filters';
import {
  nextShuffleSeed,
  type SortMode,
} from '@/shared/lib/lyric-view/lyric-view-context';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Label } from '@/shared/ui/shadcn/ui/label';

const SORT_OPTIONS: {
  mode: SortMode;
  label: string;
  icon: typeof Shuffle;
}[] = [
  { mode: 'shuffle', label: 'Вперемешку', icon: Shuffle },
  { mode: 'forward', label: 'Сначала новые', icon: ArrowDownAZ },
  { mode: 'reverse', label: 'Сначала старые', icon: ArrowUpAZ },
];

interface CatalogFilterPaneProps {
  sectionId: string;
  filters: CatalogSectionFilters;
  onChange: (next: CatalogSectionFilters) => void;
}

export function CatalogFilterPane({
  sectionId,
  filters,
  onChange,
}: CatalogFilterPaneProps) {
  const canReset = hasActiveCatalogSectionFilters(filters);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground text-xs font-normal">
          Сортировка
        </Label>
        <div
          role="radiogroup"
          aria-label="Сортировка"
          className="bg-muted grid grid-cols-3 rounded-lg p-1"
        >
          {SORT_OPTIONS.map(({ mode, label, icon: Icon }) => {
            const selected = filters.sortMode === mode;

            return (
              <Button
                key={mode}
                type="button"
                role="radio"
                size="icon-sm"
                variant="ghost"
                aria-label={
                  mode === 'shuffle'
                    ? 'Вперемешку. Повторное нажатие перемешивает заново'
                    : label
                }
                aria-checked={selected}
                title={
                  mode === 'shuffle'
                    ? 'Вперемешку — ещё раз, чтобы перемешать заново'
                    : label
                }
                className={cn(
                  'h-8 w-full rounded-md',
                  selected
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                )}
                onClick={() => {
                  let shuffleSeed = filters.shuffleSeed;

                  if (mode === 'shuffle') {
                    shuffleSeed = nextShuffleSeed(filters.shuffleSeed);
                  }

                  onChange({
                    ...filters,
                    sortMode: mode,
                    shuffleSeed,
                  });
                }}
              >
                <Icon className="size-4" />
              </Button>
            );
          })}
        </div>
      </div>

      <LyricFilterFields
        idPrefix={`catalog-filter-${sectionId}`}
        value={filters}
        onChange={(patch) => {
          onChange({ ...filters, ...patch });
        }}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={!canReset}
        onClick={() => {
          onChange({ ...DEFAULT_CATALOG_SECTION_FILTERS });
        }}
      >
        <RotateCcw className="size-4" />
        Сбросить
      </Button>
    </div>
  );
}
