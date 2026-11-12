'use client';

import { Check, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils/cn';
import { Hint } from '@/shared/ui/hint';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/shadcn/ui/popover';

export type MultiSelectGroup = {
  label?: string;
  options: { value: number; label: string }[];
};

const SEARCH_FROM = 8;

/** Мультиселект с группами. Пустой выбор — «все». `max` — после него новые пункты не выбираются. */
export function MultiSelect({
  label,
  allLabel,
  emptyText,
  groups,
  value,
  max,
  onChange,
}: {
  label: string;
  allLabel: string;
  emptyText: string;
  groups: MultiSelectGroup[];
  value: readonly number[];
  max?: number;
  onChange: (next: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const options = groups.flatMap((group) => group.options);
  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);
  const full = max !== undefined && value.length >= max;
  const needle = query.trim().toLowerCase();
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      options: needle
        ? group.options.filter(
            (option) =>
              option.label.toLowerCase().includes(needle) ||
              group.label?.toLowerCase().includes(needle)
          )
        : group.options,
    }))
    .filter((group) => group.options.length > 0);

  const toggle = (option: number) => {
    onChange(
      value.includes(option)
        ? value.filter((item) => item !== option)
        : [...value, option]
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-normal">{label}</span>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setQuery('');
          }
        }}
      >
        <div className="flex items-center gap-1">
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 min-w-0 flex-1 justify-between gap-2 font-normal"
              aria-label={label}
            >
              <span
                className={cn(
                  'truncate',
                  selectedLabels.length === 0 && 'text-muted-foreground'
                )}
              >
                {selectedLabels.length === 0
                  ? allLabel
                  : selectedLabels.join(', ')}
              </span>
              <ChevronDown className="size-4 shrink-0 opacity-60" />
            </Button>
          </PopoverTrigger>
          {value.length > 0 ? (
            <Hint label="Сбросить">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={`Сбросить: ${label}`}
                onClick={() => {
                  onChange([]);
                }}
              >
                <X className="size-4" />
              </Button>
            </Hint>
          ) : null}
        </div>
        <PopoverContent
          data-swipe-ignore
          align="start"
          className="flex max-h-80 w-72 flex-col gap-2 p-2"
        >
          {options.length >= SEARCH_FROM ? (
            <Input
              value={query}
              placeholder="Найти"
              aria-label="Найти"
              className="h-8"
              onChange={(event) => {
                setQuery(event.target.value);
              }}
            />
          ) : null}
          <div className="flex min-h-0 flex-col gap-1 overflow-y-auto">
            {visibleGroups.length === 0 ? (
              <p className="text-muted-foreground p-2 text-xs">{emptyText}</p>
            ) : null}
            {visibleGroups.map((group, groupIndex) => (
              <div
                key={group.label ?? groupIndex}
                className="flex flex-col"
                role="group"
                aria-label={group.label}
              >
                {group.label ? (
                  <span className="text-muted-foreground px-2 pt-1 text-[11px] uppercase">
                    {group.label}
                  </span>
                ) : null}
                {group.options.map((option) => {
                  const checked = value.includes(option.value);
                  const locked = full && !checked;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      disabled={locked}
                      className="hover:bg-accent flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => {
                        toggle(option.value);
                      }}
                    >
                      <span
                        className={cn(
                          'border-input flex size-4 shrink-0 items-center justify-center rounded-sm border',
                          checked &&
                            'bg-primary border-primary text-primary-foreground'
                        )}
                      >
                        {checked ? <Check className="size-3" /> : null}
                      </span>
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
