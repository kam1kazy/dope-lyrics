'use client';

import type { TrackFormPreset } from '@/entities/lyric';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Label } from '@/shared/ui/shadcn/ui/label';

import { TRACK_FORM_PRESET_LABELS } from '../lib/generator-text';

const PRESETS: TrackFormPreset[] = ['HIT', 'CANVAS'];

export function CatalogGeneratorPane({
  preset,
  hideAdlibs,
  onPresetChange,
  onHideAdlibsChange,
}: {
  preset: TrackFormPreset;
  hideAdlibs: boolean;
  onPresetChange: (preset: TrackFormPreset) => void;
  onHideAdlibsChange: (hide: boolean) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground text-xs font-normal">
          Форма
        </Label>
        <div
          role="radiogroup"
          aria-label="Форма трека"
          className="bg-muted grid grid-cols-2 rounded-lg p-1"
        >
          {PRESETS.map((value) => {
            const selected = preset === value;

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
                  onPresetChange(value);
                }}
              >
                {TRACK_FORM_PRESET_LABELS[value]}
              </Button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Хит — короткие куплеты под стрим. Полотно — до 4 абзацев на куплет.
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
        Прячет текст в круглых скобках. Хештеги и квадратные скобки убираются
        всегда.
      </p>
    </div>
  );
}
