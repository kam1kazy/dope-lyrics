'use client';

import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FilterPanel } from '@/features/filter-panel';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { useSwipeToDismiss } from '@/shared/lib/swipe/use-swipe-to-dismiss';
import { cn } from '@/shared/lib/utils/cn';
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
  const { suppressToggle } = usePlayback();

  const closeDrawer = () => {
    suppressToggle();
    setIsOpen(false);
    document.body.style.removeProperty('pointer-events');
  };

  const swipe = useSwipeToDismiss({
    enabled: isOpen,
    onDismiss: closeDrawer,
  });
  const resetSwipe = swipe.reset;

  useEffect(() => {
    if (!isOpen) {
      resetSwipe();
      document.body.style.removeProperty('pointer-events');
    }
  }, [isOpen, resetSwipe]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-end p-4">
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

      <Drawer
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDrawer();
            return;
          }

          setIsOpen(true);
        }}
      >
        <DrawerContent
          {...swipe.contentProps}
          overlayClassName={cn(!isOpen && 'pointer-events-none opacity-0')}
          className={cn(
            'min-h-0 overflow-hidden',
            swipe.dragging && 'duration-0'
          )}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onPointerDownOutside={() => {
            suppressToggle();
          }}
          onInteractOutside={() => {
            suppressToggle();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          <DrawerHeader className="sr-only pointer-events-none">
            <DrawerTitle>Настройки</DrawerTitle>
            <DrawerDescription>
              Внешний вид, порядок показа и фильтры каталога
            </DrawerDescription>
          </DrawerHeader>
          <FilterPanel />
        </DrawerContent>
      </Drawer>
    </>
  );
};
