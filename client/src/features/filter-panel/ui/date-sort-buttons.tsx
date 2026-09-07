'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';

import {
  type DateSortField,
  type DateSortState,
  nextDateSort,
} from '@/shared/lib/catalog-section-filters';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';

const OPTIONS: {
  field: DateSortField;
  label: string;
  titleName: string;
}[] = [
  {
    field: 'added',
    label: 'По добавлению',
    titleName: 'По дате добавления в приложение',
  },
  {
    field: 'created',
    label: 'По созданию',
    titleName: 'По дате создания в источнике',
  },
];

function optionTitle(
  titleName: string,
  field: DateSortField,
  state: DateSortState
) {
  const direction =
    (state.field === field ? state.direction : 'desc') === 'desc'
      ? 'убывание'
      : 'возрастание';

  return `${titleName} — ${direction}`;
}

export function DateSortButtons({
  value,
  onChange,
}: {
  value: DateSortState;
  onChange: (next: DateSortState) => void;
}) {
  return (
    <div
      data-swipe-ignore
      role="group"
      aria-label="Сортировка по дате"
      className="grid min-w-0 grid-cols-2 gap-2"
    >
      {OPTIONS.map(({ field, label, titleName }) => {
        const active = value.field === field;
        const direction = active ? value.direction : 'desc';
        const Icon = direction === 'asc' ? ArrowUp : ArrowDown;
        const title = optionTitle(titleName, field, value);

        return (
          <Button
            key={field}
            type="button"
            variant="ghost"
            aria-pressed={active}
            aria-label={title}
            title={title}
            className={cn(
              'h-8 min-w-0 gap-1.5 rounded-md px-2',
              active ? 'bg-muted text-foreground' : 'text-muted-foreground'
            )}
            onClick={() => {
              onChange(nextDateSort(value, field));
            }}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate text-xs font-normal">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}
