'use client';

import { Input } from '@/shared/ui/shadcn/ui/input';
import { Label } from '@/shared/ui/shadcn/ui/label';

export function FilterPanel() {
  return (
    <div className="flex flex-col gap-4 pb-4 text-sm">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="filter-word-count">Кол-во слов</Label>
        <Input
          id="filter-word-count"
          type="number"
          min={0}
          defaultValue={0}
          className="w-[120px]"
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="filter-paragraph-count">Кол-во абзацев</Label>
        <Input
          id="filter-paragraph-count"
          type="number"
          min={0}
          defaultValue={0}
          className="w-[120px]"
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="filter-tag">Наименование тега</Label>
        <Input id="filter-tag" placeholder="Теги" className="w-[120px]" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="filter-keywords">Ключевые слова</Label>
        <Input id="filter-keywords" placeholder="Слова" className="w-[120px]" />
      </div>
    </div>
  );
}
