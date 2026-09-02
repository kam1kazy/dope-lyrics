'use client';

import { disableFacetValue, selectFacetValue } from '@/shared/lib/lyric-facets';
import { cn } from '@/shared/lib/utils/cn';
import { Badge } from '@/shared/ui/shadcn/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/shadcn/ui/tooltip';

export function FacetChipGroup<T extends string>({
  label,
  options,
  labels,
  hints,
  value,
  multiple,
  accent,
  onChange,
  onSelect,
  size = 'filter',
}: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  hints: Record<T, string>;
  value: readonly T[];
  multiple: boolean;
  accent?: T | null;
  onChange: (next: T[]) => void;
  onSelect?: (option: T) => void;
  size?: 'filter' | 'desk';
}) {
  const badgeClass =
    size === 'desk'
      ? 'px-2 py-0.5 text-xs sm:px-2.5 sm:py-1 sm:text-sm'
      : 'px-2 py-0.5 text-xs md:px-2.5 md:py-1 md:text-sm';

  return (
    <div
      className={
        size === 'desk'
          ? 'flex flex-col gap-2 sm:gap-3'
          : 'flex flex-col gap-2 md:gap-3'
      }
    >
      {size === 'desk' ? (
        <p className="text-muted-foreground text-xs sm:text-sm">{label}</p>
      ) : (
        <p className="text-muted-foreground text-xs font-normal md:text-sm">
          {label}
        </p>
      )}
      <div
        data-swipe-ignore
        className={
          size === 'desk'
            ? 'flex flex-wrap gap-1.5 sm:gap-2'
            : 'flex flex-wrap gap-1.5 md:gap-2'
        }
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const selected = value.includes(option);
          const isAccent = accent === option;

          return (
            <Tooltip key={option}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-current={isAccent || undefined}
                  aria-label={labels[option]}
                  onMouseDown={(event) => {
                    if (event.detail > 1) {
                      event.preventDefault();
                    }
                  }}
                  onClick={() => {
                    onSelect?.(option);
                    onChange(selectFacetValue(value, option, multiple));
                  }}
                  onDoubleClick={() =>
                    onChange(disableFacetValue(value, option))
                  }
                  className="cursor-pointer"
                >
                  <Badge
                    variant={selected ? 'default' : 'secondary'}
                    className={cn(
                      badgeClass,
                      isAccent && 'ring-foreground/50 ring-2'
                    )}
                  >
                    {labels[option]}
                  </Badge>
                </button>
              </TooltipTrigger>
              <TooltipContent>{hints[option]}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
