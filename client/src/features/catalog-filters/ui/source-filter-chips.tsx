'use client';

import {
  LYRIC_SOURCE_LABELS,
  LYRIC_SOURCES,
  type LyricSource,
  toggleFacetValue,
} from '@/shared/lib/lyric-facets';
import { cn } from '@/shared/lib/utils/cn';
import { Badge } from '@/shared/ui/shadcn/ui/badge';
import { Label } from '@/shared/ui/shadcn/ui/label';

export function SourceFilterChips({
  selected,
  onChange,
}: {
  selected: LyricSource[];
  onChange: (next: LyricSource[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground text-xs font-normal">
        Откуда
      </Label>
      <div
        data-swipe-ignore
        role="group"
        aria-label="Источник заметки"
        className="flex flex-wrap gap-1.5"
      >
        {LYRIC_SOURCES.map((source) => {
          const active = selected.includes(source);

          return (
            <button
              key={source}
              type="button"
              aria-pressed={active}
              className="rounded-full"
              onClick={() => {
                onChange(toggleFacetValue(selected, source, true));
              }}
            >
              <Badge
                variant={active ? 'default' : 'secondary'}
                className={cn(
                  'cursor-pointer px-2.5 py-1 text-xs font-normal',
                  !active && 'text-muted-foreground'
                )}
              >
                {LYRIC_SOURCE_LABELS[source]}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
