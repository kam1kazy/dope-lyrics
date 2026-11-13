'use client';

import { useQuery } from '@apollo/client/react';
import { Sparkles } from 'lucide-react';

import type { TrackFormQuotas } from '@/entities/lyric';
import {
  AI_STATUS,
  ReferenceFilterFields,
  TrackFormFields,
} from '@/features/catalog-assemble';
import { formatQueryError } from '@/shared/lib/format-query-error';
import {
  LYRIC_DELIVERIES,
  LYRIC_DELIVERY_LABELS,
  LYRIC_ENERGIES,
  LYRIC_ENERGY_LABELS,
  LYRIC_MOOD_LABELS,
  LYRIC_MOODS,
} from '@/shared/lib/lyric-facets';
import type { ReferenceFilter } from '@/shared/lib/reference-filter';
import { useRetainedState } from '@/shared/lib/retained-state';
import { cn } from '@/shared/lib/utils/cn';
import { Hint } from '@/shared/ui/hint';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Label } from '@/shared/ui/shadcn/ui/label';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  type ScratchFacets,
  type ScratchSession,
} from '../lib/use-scratch-session';

const EMPTY_FACETS: ScratchFacets = { moods: [], deliveries: [], energies: [] };

function FacetChips<T extends string>({
  label,
  values,
  labels,
  selected,
  onChange,
}: {
  label: string;
  values: readonly T[];
  labels: Record<T, string>;
  selected: readonly T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs font-normal">
        {label}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) => {
          const on = selected.includes(value);

          return (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={on ? 'secondary' : 'outline'}
              className={cn('h-7 px-2.5 text-xs', on && 'border-transparent')}
              aria-pressed={on}
              onClick={() => {
                onChange(
                  on
                    ? selected.filter((item) => item !== value)
                    : [...selected, value]
                );
              }}
            >
              {labels[value]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function FromScratchPage({
  form,
  references,
  onFormChange,
  onReferencesChange,
  session,
}: {
  form: TrackFormQuotas;
  references: ReferenceFilter;
  onFormChange: (form: TrackFormQuotas) => void;
  onReferencesChange: (references: ReferenceFilter) => void;
  session: ScratchSession;
}) {
  const [theme, setTheme] = useRetainedState('scratch-theme', '');
  const [facets, setFacets] = useRetainedState<ScratchFacets>(
    'scratch-facets',
    EMPTY_FACETS
  );
  const { data: status } = useQuery<{ aiStatus: { enabled: boolean } }>(
    AI_STATUS
  );
  const { answer, writing, saving, error } = session;

  const enabled = status?.aiStatus.enabled === true;
  const trimmedTheme = theme.trim();
  const busy = writing || saving;

  const writeHint = !enabled
    ? 'ИИ не настроен'
    : trimmedTheme
      ? 'Написать'
      : 'Написать: сначала тема';

  return (
    <div className="flex flex-col gap-5 p-4" data-swipe-ignore>
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="scratch-theme"
          className="text-muted-foreground text-xs font-normal"
        >
          Тема
        </Label>
        <textarea
          id="scratch-theme"
          value={theme}
          rows={3}
          placeholder="О чём трек: мир, герой, поворот"
          className="border-input bg-background focus-visible:ring-ring/50 w-full resize-none rounded-md border p-3 text-sm outline-none focus-visible:ring-2"
          onChange={(event) => {
            setTheme(event.target.value);
          }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <FacetChips
          label="Настроение"
          values={LYRIC_MOODS}
          labels={LYRIC_MOOD_LABELS}
          selected={facets.moods}
          onChange={(moods) => {
            setFacets({ ...facets, moods });
          }}
        />
        <FacetChips
          label="Подача"
          values={LYRIC_DELIVERIES}
          labels={LYRIC_DELIVERY_LABELS}
          selected={facets.deliveries}
          onChange={(deliveries) => {
            setFacets({ ...facets, deliveries });
          }}
        />
        <FacetChips
          label="Энергия"
          values={LYRIC_ENERGIES}
          labels={LYRIC_ENERGY_LABELS}
          selected={facets.energies}
          onChange={(energies) => {
            setFacets({ ...facets, energies });
          }}
        />
        <p className="text-muted-foreground text-xs leading-relaxed">
          Грани подбирают эталоны. Без граней — случайные тексты с полки.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <TrackFormFields form={form} onFormChange={onFormChange} />
      </div>

      <ReferenceFilterFields
        value={references}
        hint="Выбранные тексты идут всегда, выбранные артисты — только их тексты."
        onChange={onReferencesChange}
      />

      <div className="flex items-center gap-2">
        <Hint label={writeHint}>
          <span>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-9"
              aria-label="Написать"
              disabled={!enabled || !trimmedTheme || busy}
              onClick={() => {
                void session.write({
                  theme: trimmedTheme,
                  form,
                  facets,
                  references,
                });
              }}
            >
              {writing && !answer ? (
                <Spinner className="size-4" />
              ) : (
                <Sparkles className="size-4" />
              )}
            </Button>
          </span>
        </Hint>
        {status && !enabled ? (
          <p className="text-muted-foreground text-xs">ИИ не настроен</p>
        ) : null}
      </div>

      {error ? (
        <p className="text-destructive text-xs">{formatQueryError(error)}</p>
      ) : null}
    </div>
  );
}
