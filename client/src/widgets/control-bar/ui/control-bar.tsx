'use client';

import { Settings } from 'lucide-react';
import { useState } from 'react';

import { FilterPanel } from '@/features/filter-panel';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/shadcn/ui/drawer';

export const ControlBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-end p-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="pointer-events-auto text-muted-foreground hover:text-foreground"
          aria-label="Настройки"
          aria-expanded={isOpen}
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen(true);
          }}
        >
          <Settings className="size-6" />
        </Button>
      </div>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <DrawerHeader>
            <DrawerTitle>Фильтры</DrawerTitle>
            <DrawerDescription className="sr-only">
              Настройки отображения текстов
            </DrawerDescription>
          </DrawerHeader>
          <FilterPanel />
        </DrawerContent>
      </Drawer>
    </>
  );
};
