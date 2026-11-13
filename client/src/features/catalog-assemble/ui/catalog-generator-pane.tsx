'use client';

import type { TrackFormQuotas } from '@/entities/lyric';
import { CatalogFilterPane } from '@/features/catalog-filters';
import {
  type CatalogSectionFilters,
  DEFAULT_GENERATOR_SECTION_FILTERS,
} from '@/shared/lib/catalog-section-filters';
import type { ReferenceFilter } from '@/shared/lib/reference-filter';
import { cn } from '@/shared/lib/utils/cn';
import { Label } from '@/shared/ui/shadcn/ui/label';

import { ReferenceFilterFields } from './reference-filter-fields';
import { TrackFormFields } from './track-form-fields';

export function CatalogGeneratorPane({
  form,
  hideAdlibs,
  filters,
  references,
  showReferences,
  onFormChange,
  onHideAdlibsChange,
  onFiltersChange,
  onReferencesChange,
}: {
  form: TrackFormQuotas;
  hideAdlibs: boolean;
  filters: CatalogSectionFilters;
  references: ReferenceFilter;
  showReferences: boolean;
  onFormChange: (form: TrackFormQuotas) => void;
  onHideAdlibsChange: (hide: boolean) => void;
  onFiltersChange: (filters: CatalogSectionFilters) => void;
  onReferencesChange: (references: ReferenceFilter) => void;
}) {
  return (
    <CatalogFilterPane
      sectionId="generator"
      filters={filters}
      onChange={onFiltersChange}
      hideSort
      showShelves
      defaults={DEFAULT_GENERATOR_SECTION_FILTERS}
      header={
        <>
          <TrackFormFields form={form} onFormChange={onFormChange} />

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="hide-adlibs" className="text-sm font-normal">
              Скрыть адлибы
            </Label>
            <button
              id="hide-adlibs"
              type="button"
              role="switch"
              aria-checked={hideAdlibs}
              className={cn(
                'focus-visible:ring-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
                'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                hideAdlibs ? 'bg-primary' : 'bg-muted'
              )}
              onClick={() => {
                onHideAdlibsChange(!hideAdlibs);
              }}
            >
              <span
                aria-hidden
                className={cn(
                  'bg-background pointer-events-none block size-4 rounded-full shadow-sm transition-transform',
                  hideAdlibs ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </button>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Прячет текст в круглых скобках.
          </p>

          {showReferences ? (
            <ReferenceFilterFields
              value={references}
              hint="Для «Поправить ИИ»: выбранные — только они."
              onChange={onReferencesChange}
            />
          ) : null}
        </>
      }
    />
  );
}
