'use client';

import { cn } from '@/shared/lib/utils/cn';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Label } from '@/shared/ui/shadcn/ui/label';
import { Separator } from '@/shared/ui/shadcn/ui/separator';

export function FilterPanel({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      className={cn(
        'pointer-events-auto absolute right-0 bottom-14 w-[min(100%,24rem)] origin-bottom-right rounded-md border bg-card p-6 text-card-foreground shadow-md transition-all duration-200',
        isOpen
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-2 scale-95 opacity-0'
      )}
      aria-hidden={!isOpen}
    >
      <h2 className="mb-2 text-lg font-semibold">Фильтры</h2>
      <Separator className="mb-4" />

      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="filter-word-count">Кол-во слов</Label>
          <Input
            id="filter-word-count"
            type="number"
            min={0}
            defaultValue={0}
            className="w-[90px]"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="filter-paragraph-count">Кол-во абзацев</Label>
          <Input
            id="filter-paragraph-count"
            type="number"
            min={0}
            defaultValue={0}
            className="w-[90px]"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="filter-tag">Наименование тега</Label>
          <Input id="filter-tag" placeholder="Теги" className="w-[90px]" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="filter-keywords">Ключевые слова</Label>
          <Input
            id="filter-keywords"
            placeholder="Слова"
            className="w-[90px]"
          />
        </div>
      </div>
    </div>
  );
}
