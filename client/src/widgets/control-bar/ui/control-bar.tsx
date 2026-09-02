'use client';

import { Settings } from 'lucide-react';
import { useState } from 'react';

import { FilterPanel } from '@/features/filter-panel';
import { Button } from '@/shared/ui/shadcn/ui/button';

export const ControlBar = () => {
  const [isOpenList, setIsOpenList] = useState(false);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-end p-4"
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="relative">
        <FilterPanel isOpen={isOpenList} />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="pointer-events-auto text-muted-foreground hover:text-foreground"
          aria-label="Настройки"
          aria-expanded={isOpenList}
          onClick={() => {
            setIsOpenList((open) => !open);
          }}
        >
          <Settings className="size-6" />
        </Button>
      </div>
    </div>
  );
};
