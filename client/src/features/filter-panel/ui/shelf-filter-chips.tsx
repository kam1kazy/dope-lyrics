'use client';

import { Ban, Bookmark, EyeOff, Layers, Sparkles,Split } from 'lucide-react';
import { type MouseEvent, useEffect, useRef } from 'react';

import {
  clickShelfFlag,
  isAllShelvesSelected,
  isShelfFlagExcluded,
  isShelfFlagOn,
  selectAllShelves,
  type ShelfFlag,
  type ShelfSelection,
  toggleExcludeShelfFlag,
} from '@/shared/lib/lyric-view/shelf-filter';
import { cn } from '@/shared/lib/utils/cn';
import { Badge } from '@/shared/ui/shadcn/ui/badge';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Label } from '@/shared/ui/shadcn/ui/label';

const SHELF_OPTIONS: {
  flag: ShelfFlag;
  label: string;
  icon: typeof Bookmark;
}[] = [
  { flag: 'favorites', label: 'Избранное', icon: Bookmark },
  { flag: 'references', label: 'Эталоны', icon: Sparkles },
  { flag: 'censored', label: 'Цензура', icon: Ban },
  { flag: 'hidden', label: 'Скрытые', icon: EyeOff },
  { flag: 'donors', label: 'Доноры', icon: Split },
];

const SHELF_ICON_OPTIONS: {
  flag: ShelfFlag;
  label: string;
  icon: typeof Bookmark;
}[] = [
  { flag: 'favorites', label: 'Избранное', icon: Bookmark },
  { flag: 'references', label: 'Эталон', icon: Sparkles },
  { flag: 'hidden', label: 'Скрыть', icon: EyeOff },
  { flag: 'censored', label: 'Цензура', icon: Ban },
  { flag: 'donors', label: 'Донор', icon: Split },
];

const SHELF_CLICK_DELAY_MS = 280;

export function ShelfFilterChips({
  selection,
  onChange,
  variant = 'labeled',
}: {
  selection: ShelfSelection;
  onChange: (
    next: ShelfSelection | ((current: ShelfSelection) => ShelfSelection)
  ) => void;
  variant?: 'labeled' | 'icons';
}) {
  const allShelves = isAllShelvesSelected(selection);
  const clickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current != null) {
        window.clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const clearShelfClickTimer = () => {
    if (clickTimerRef.current != null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  };

  const bindFlagClicks = (flag: ShelfFlag) => ({
    onMouseDown: (event: MouseEvent<HTMLButtonElement>) => {
      if (event.detail > 1) {
        event.preventDefault();
      }
    },
    onClick: () => {
      clearShelfClickTimer();
      clickTimerRef.current = window.setTimeout(() => {
        clickTimerRef.current = null;
        onChange((current) => clickShelfFlag(current, flag));
      }, SHELF_CLICK_DELAY_MS);
    },
    onDoubleClick: () => {
      clearShelfClickTimer();
      onChange((current) => toggleExcludeShelfFlag(current, flag));
    },
  });

  if (variant === 'icons') {
    return (
      <div
        data-swipe-ignore
        role="group"
        aria-label="Полка каталога"
        className="bg-muted grid grid-cols-4 rounded-lg p-1"
      >
        {SHELF_ICON_OPTIONS.map(({ flag, label, icon: Icon }) => {
          const selected = isShelfFlagOn(selection, flag);
          const excluded = isShelfFlagExcluded(selection, flag);

          return (
            <Button
              key={flag}
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-pressed={selected}
              aria-label={excluded ? `${label}, исключено из поиска` : label}
              title={excluded ? `${label} — исключено` : label}
              className={cn(
                'h-8 w-full rounded-md',
                excluded
                  ? 'shelf-chip-excluded hover:brightness-110'
                  : selected
                    ? 'bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground'
                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
              )}
              {...bindFlagClicks(flag)}
            >
              <Icon className="size-4" />
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground text-xs font-normal">Полка</Label>
      <div
        data-swipe-ignore
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Полка каталога"
      >
        <button
          type="button"
          aria-pressed={allShelves}
          aria-label="Все"
          onClick={() => {
            clearShelfClickTimer();
            onChange(selectAllShelves());
          }}
          className="cursor-pointer"
        >
          <Badge
            variant={allShelves ? 'default' : 'secondary'}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs"
          >
            <Layers className="size-3" aria-hidden />
            Все
          </Badge>
        </button>
        {SHELF_OPTIONS.map(({ flag, label, icon: Icon }) => {
          const selected = isShelfFlagOn(selection, flag);
          const excluded = isShelfFlagExcluded(selection, flag);

          return (
            <button
              key={flag}
              type="button"
              aria-pressed={selected}
              aria-label={excluded ? `${label}, исключена из поиска` : label}
              className="cursor-pointer"
              {...bindFlagClicks(flag)}
            >
              <Badge
                variant={selected || excluded ? 'default' : 'secondary'}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 text-xs',
                  excluded && 'shelf-chip-excluded hover:brightness-110'
                )}
              >
                <Icon className="size-3" aria-hidden />
                {label}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
