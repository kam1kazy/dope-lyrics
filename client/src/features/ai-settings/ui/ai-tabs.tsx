'use client';

import { Button } from '@/shared/ui/shadcn/ui/button';

export type AiTabKey = 'prompt' | 'versions' | 'usage';

const TABS: { key: AiTabKey; label: string }[] = [
  { key: 'prompt', label: 'Промпт' },
  { key: 'versions', label: 'Версии' },
  { key: 'usage', label: 'Расходы' },
];

export function AiTabs({
  value,
  onChange,
}: {
  value: AiTabKey;
  onChange: (key: AiTabKey) => void;
}) {
  return (
    <div role="tablist" className="border-border flex gap-1 border-b pb-2">
      {TABS.map(({ key, label }) => (
        <Button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          variant={value === key ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => {
            onChange(key);
          }}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
