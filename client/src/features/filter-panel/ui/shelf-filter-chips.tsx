'use client';

import {
  Ban,
  Bookmark,
  EyeOff,
  Layers,
  MoreHorizontal,
  Sparkles,
  Split,
} from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/shadcn/ui/popover';

const VISIBLE_SHELF_OPTIONS: {
  flag: ShelfFlag;
  label: string;
  icon: typeof Bookmark;
}[] = [
  { flag: 'favorites', label: 'Избранное', icon: Bookmark },
  { flag: 'references', label: 'Эталон', icon: Sparkles },
  { flag: 'hidden', label: 'Скрытые', icon: EyeOff },
];

const OVERFLOW_SHELF_OPTIONS: {
  flag: ShelfFlag;
  label: string;
  icon: typeof Bookmark;
}[] = [
  { flag: 'censored', label: 'Цензура', icon: Ban },
  { flag: 'donors', label: 'Донор', icon: Split },
];

const OVERFLOW_FLAGS = OVERFLOW_SHELF_OPTIONS.map(({ flag }) => flag);

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
  const overflowOn = OVERFLOW_FLAGS.some((flag) =>
    isShelfFlagOn(selection, flag)
  );
  const overflowExcluded = OVERFLOW_FLAGS.some((flag) =>
    isShelfFlagExcluded(selection, flag)
  );

  useEffect(() => {
    return () => {
      if (clickTimerRef.current !== null) {
        window.clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const clearShelfClickTimer = () => {
    if (clickTimerRef.current !== null) {
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

  const overflowMenu = (
    <div className="flex flex-col">
      {OVERFLOW_SHELF_OPTIONS.map(({ flag, label, icon: Icon }) => {
        const selected = isShelfFlagOn(selection, flag);
        const excluded = isShelfFlagExcluded(selection, flag);

        return (
          <button
            key={flag}
            type="button"
            role="menuitemcheckbox"
            aria-checked={selected}
            aria-label={excluded ? `${label}, исключено из поиска` : label}
            className={cn(
              'hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm',
              excluded && 'shelf-chip-excluded hover:brightness-110'
            )}
            {...bindFlagClicks(flag)}
          >
            <Icon
              className={cn(
                'size-4',
                selected && flag === 'censored' && 'text-rose-400',
                selected && flag === 'donors' && 'text-sky-400'
              )}
              aria-hidden
            />
            {label}
            {selected || excluded ? (
              <span
                className={cn(
                  'ml-auto size-1.5 rounded-full',
                  excluded ? 'bg-white/80' : 'bg-primary'
                )}
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );

  if (variant === 'icons') {
    return (
      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground text-xs font-normal">
          Полка
        </Label>
        <div
          data-swipe-ignore
          role="group"
          aria-label="Полка каталога"
          className="bg-muted grid grid-cols-[1fr_1fr_1fr_auto] rounded-lg p-1"
        >
          {VISIBLE_SHELF_OPTIONS.map(({ flag, label, icon: Icon }) => {
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Ещё"
                aria-haspopup="menu"
                title="Ещё"
                className="text-muted-foreground hover:bg-background/60 hover:text-foreground relative h-8 w-8 min-w-8 shrink-0 rounded-md px-0"
              >
                <MoreHorizontal className="size-4" />
                {overflowOn || overflowExcluded ? (
                  <>
                    <span
                      className="bg-primary absolute top-1 right-0.5 size-1.5 rounded-full"
                      aria-hidden
                    />
                    <span className="sr-only">есть метки</span>
                  </>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              className="w-auto min-w-[10rem] p-1"
              data-swipe-ignore
            >
              {overflowMenu}
            </PopoverContent>
          </Popover>
        </div>
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
        {VISIBLE_SHELF_OPTIONS.map(({ flag, label, icon: Icon }) => {
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
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Ещё"
              aria-haspopup="menu"
              className="cursor-pointer"
            >
              <Badge
                variant="secondary"
                className="relative inline-flex items-center px-1.5 py-0.5 text-xs"
              >
                <MoreHorizontal className="size-3" aria-hidden />
                {overflowOn || overflowExcluded ? (
                  <>
                    <span
                      className="bg-primary absolute -top-0.5 -right-0.5 size-1.5 rounded-full"
                      aria-hidden
                    />
                    <span className="sr-only">есть метки</span>
                  </>
                ) : null}
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            className="w-auto min-w-[10rem] p-1"
            data-swipe-ignore
          >
            {overflowMenu}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
