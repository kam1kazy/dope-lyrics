'use client';

import { useEffect, useState } from 'react';

import type { TrackFormPreset, TrackFormQuotas } from '@/entities/lyric';
import { CatalogFilterPane } from '@/features/catalog-filters';
import {
  type CatalogSectionFilters,
  DEFAULT_GENERATOR_SECTION_FILTERS,
} from '@/shared/lib/catalog-section-filters';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Label } from '@/shared/ui/shadcn/ui/label';

import {
  matchingTrackFormPreset,
  TRACK_FORM_PRESET_QUOTAS,
  TRACK_FORM_PRESETS,
} from '../lib/generator-form';
import { TRACK_FORM_PRESET_LABELS } from '../lib/generator-text';

function ParagraphField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
      <input
        id={id}
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={draft}
        aria-label={label}
        className={cn(
          'border-input bg-background h-8 w-16 rounded-md border px-2 text-right text-sm tabular-nums',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
        )}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (next === '') {
            return;
          }

          const parsed = Number(next);
          if (Number.isInteger(parsed) && parsed >= 0) {
            onChange(parsed);
          }
        }}
        onBlur={() => {
          if (draft === '') {
            onChange(0);
            setDraft('0');
            return;
          }

          const parsed = Number(draft);
          if (!Number.isInteger(parsed) || parsed < 0) {
            setDraft(String(value));
            return;
          }

          onChange(parsed);
          setDraft(String(parsed));
        }}
      />
    </div>
  );
}

export function CatalogGeneratorPane({
  form,
  hideAdlibs,
  filters,
  onFormChange,
  onHideAdlibsChange,
  onFiltersChange,
}: {
  form: TrackFormQuotas;
  hideAdlibs: boolean;
  filters: CatalogSectionFilters;
  onFormChange: (form: TrackFormQuotas) => void;
  onHideAdlibsChange: (hide: boolean) => void;
  onFiltersChange: (filters: CatalogSectionFilters) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const selectedPreset = matchingTrackFormPreset(form);

  const setField = (key: keyof TrackFormQuotas, value: number) => {
    onFormChange({ ...form, [key]: value });
  };

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
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs font-normal">
              Форма
            </Label>
            <div
              role="radiogroup"
              aria-label="Форма трека"
              className="bg-muted grid grid-cols-2 rounded-lg p-1"
            >
              {TRACK_FORM_PRESETS.map((value: TrackFormPreset) => {
                const selected = selectedPreset === value;

                return (
                  <Button
                    key={value}
                    type="button"
                    role="radio"
                    size="sm"
                    variant="ghost"
                    aria-checked={selected}
                    className={cn(
                      'h-8 w-full rounded-md',
                      selected
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )}
                    onClick={() => {
                      onFormChange({ ...TRACK_FORM_PRESET_QUOTAS[value] });
                    }}
                  >
                    {TRACK_FORM_PRESET_LABELS[value]}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <ParagraphField
              id="form-verse"
              label="Куплет"
              value={form.verse}
              onChange={(value) => {
                setField('verse', value);
              }}
            />
            <ParagraphField
              id="form-hook"
              label="Хук"
              value={form.hook}
              onChange={(value) => {
                setField('hook', value);
              }}
            />
            {moreOpen ? (
              <>
                <ParagraphField
                  id="form-intro"
                  label="Интро"
                  value={form.intro}
                  onChange={(value) => {
                    setField('intro', value);
                  }}
                />
                <ParagraphField
                  id="form-bridge"
                  label="Бридж"
                  value={form.bridge}
                  onChange={(value) => {
                    setField('bridge', value);
                  }}
                />
              </>
            ) : null}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground w-fit text-xs font-normal"
              onClick={() => {
                setMoreOpen((open) => !open);
              }}
            >
              {moreOpen ? 'Скрыть' : 'Показать ещё'}
            </button>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Абзац = 4 строки. 0 — слот не набирать.
            </p>
          </div>

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
        </>
      }
    />
  );
}
