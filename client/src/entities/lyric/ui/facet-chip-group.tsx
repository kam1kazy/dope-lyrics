'use client';

import { useEffect, useRef, useState } from 'react';

import {
  clickFacetFilter,
  disableFacetValue,
  selectFacetValue,
  toggleExcludeFacetFilter,
  toggleFacetValue,
} from '@/shared/lib/lyric-facets';
import { cn } from '@/shared/lib/utils/cn';
import { Badge } from '@/shared/ui/shadcn/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/shadcn/ui/tooltip';

const EXCLUDE_CLICK_DELAY_MS = 280;

export function FacetChipGroup<T extends string>({
  label,
  options,
  labels,
  hints,
  value,
  excluded = [],
  multiple,
  accent,
  toggleOnClick = false,
  allowExclude = false,
  onChange,
  onExcludedChange,
  onFilterChange,
  onSelect,
  size = 'filter',
}: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  hints: Record<T, string>;
  value: readonly T[];
  excluded?: readonly T[];
  multiple: boolean;
  accent?: T | null;
  toggleOnClick?: boolean;
  allowExclude?: boolean;
  onChange: (next: T[]) => void;
  onExcludedChange?: (next: T[]) => void;
  onFilterChange?: (next: { included: T[]; excluded: T[] }) => void;
  onSelect?: (option: T) => void;
  size?: 'filter' | 'desk';
}) {
  const [openHint, setOpenHint] = useState<T | null>(null);
  const clickTimerRef = useRef<number | null>(null);
  const badgeClass =
    size === 'desk'
      ? 'px-2 py-0.5 text-xs sm:px-2.5 sm:py-1 sm:text-sm'
      : 'px-2 py-0.5 text-xs md:px-2.5 md:py-1 md:text-sm';

  useEffect(() => {
    return () => {
      if (clickTimerRef.current != null) {
        window.clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const clearClickTimer = () => {
    if (clickTimerRef.current != null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  };

  const applyFilter = (next: { included: T[]; excluded: T[] }) => {
    if (onFilterChange) {
      onFilterChange(next);
      return;
    }

    onChange(next.included);
    onExcludedChange?.(next.excluded);
  };

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
        onPointerLeave={() => setOpenHint(null)}
      >
        {options.map((option) => {
          const selected = value.includes(option);
          const isExcluded = excluded.includes(option);
          const isAccent = accent === option;
          const filled = accent !== undefined ? isAccent : selected;
          const outlined = selected && !filled;

          return (
            <Tooltip
              key={option}
              open={openHint === option}
              onOpenChange={(open) => {
                setOpenHint((current) => {
                  if (open) {
                    return option;
                  }

                  return current === option ? null : current;
                });
              }}
            >
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-current={isAccent || undefined}
                  aria-label={
                    isExcluded
                      ? `${labels[option]}, исключено из поиска`
                      : labels[option]
                  }
                  onMouseDown={(event) => {
                    if (event.detail > 1) {
                      event.preventDefault();
                    }
                  }}
                  onClick={(event) => {
                    if (allowExclude) {
                      if (event.detail > 1) {
                        return;
                      }

                      setOpenHint(null);
                      clearClickTimer();
                      clickTimerRef.current = window.setTimeout(() => {
                        clickTimerRef.current = null;
                        applyFilter(
                          clickFacetFilter(value, excluded, option, multiple)
                        );
                      }, EXCLUDE_CLICK_DELAY_MS);
                      return;
                    }

                    if (toggleOnClick && event.detail > 1) {
                      return;
                    }

                    setOpenHint(null);
                    onSelect?.(option);
                    onChange(
                      toggleOnClick
                        ? toggleFacetValue(value, option, multiple)
                        : selectFacetValue(value, option, multiple)
                    );
                  }}
                  onDoubleClick={() => {
                    if (allowExclude) {
                      clearClickTimer();
                      applyFilter(
                        toggleExcludeFacetFilter(value, excluded, option)
                      );
                      return;
                    }

                    if (toggleOnClick) {
                      return;
                    }

                    onChange(disableFacetValue(value, option));
                  }}
                  className={cn(
                    'cursor-pointer rounded-md',
                    outlined && 'shadow-[0_1px_6px_rgba(255,255,255,0.35)]'
                  )}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      badgeClass,
                      filled &&
                        !isExcluded &&
                        'border-white bg-white text-black',
                      outlined &&
                        !isExcluded &&
                        'border-white bg-black text-white',
                      !selected &&
                        !isExcluded &&
                        'border-white/15 bg-black/40 text-white/60',
                      isExcluded && 'shelf-chip-excluded'
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
