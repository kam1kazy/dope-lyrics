'use client';

import { CalendarRange } from 'lucide-react';

import { DateRangeInputs } from '@/features/filter-panel';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Label } from '@/shared/ui/shadcn/ui/label';

import {
  matchingStatsPeriodPreset,
  STATS_PERIOD_PRESETS,
  statsPeriodRange,
} from '../lib/stats-period';

export function PeriodFilterFields({
  dateFrom,
  dateTo,
  onChange,
  idPrefix,
}: {
  dateFrom: string;
  dateTo: string;
  onChange: (next: { dateFrom: string; dateTo: string }) => void;
  idPrefix: string;
}) {
  const selectedPreset = matchingStatsPeriodPreset(dateFrom, dateTo);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label className="text-muted-foreground flex items-center gap-1.5 text-xs font-normal">
        <CalendarRange className="size-3.5" aria-hidden />
        Период
      </Label>
      <div
        role="radiogroup"
        aria-label="Период"
        className="bg-muted grid grid-cols-3 rounded-lg p-1"
      >
        {STATS_PERIOD_PRESETS.map(({ id, label }) => {
          const selected = selectedPreset === id;

          return (
            <Button
              key={id}
              type="button"
              role="radio"
              size="sm"
              variant="ghost"
              aria-checked={selected}
              className={cn(
                'h-8 w-full rounded-md text-xs',
                selected
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              )}
              onClick={() => {
                if (selected) {
                  onChange({ dateFrom: '', dateTo: '' });
                  return;
                }

                onChange(statsPeriodRange(id));
              }}
            >
              {label}
            </Button>
          );
        })}
      </div>
      <DateRangeInputs
        idPrefix={idPrefix}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChange={onChange}
      />
    </div>
  );
}
