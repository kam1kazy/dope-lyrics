'use client';

import { History, Settings, Shuffle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useSaveCarouselSnapshot } from '@/features/carousel-history';
import { FilterPanel } from '@/features/filter-panel';
import { useCarouselSession } from '@/shared/lib/carousel-session/carousel-session-context';
import { useCatalogMenu } from '@/shared/lib/catalog-menu/catalog-menu-context';
import { useLyricView } from '@/shared/lib/lyric-view/lyric-view-context';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { useSwipeToDismiss } from '@/shared/lib/swipe/use-swipe-to-dismiss';
import { chromeKeyClass } from '@/shared/lib/utils/chrome-key-class';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/shadcn/ui/drawer';

import { LyricTuneHotkeys } from './lyric-tune-hotkeys';

export const ControlBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [litKey, setLitKey] = useState<
    'shuffle' | 'history' | 'settings' | null
  >(null);
  const { setSortMode } = useLyricView();
  const { resetToCatalog } = useCarouselSession();
  const { saveSnapshot } = useSaveCarouselSnapshot();
  const { openSection } = useCatalogMenu();
  const { paused, canPlay, suppressToggle, beginOverlay, endOverlay } =
    usePlayback();
  const playing = !paused && canPlay;

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
      return;
    }

    beginOverlay();
    return () => {
      endOverlay();
    };
  }, [beginOverlay, endOverlay, isOpen, resetSwipe]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-end p-4">
        <div className="flex flex-col items-center">
          <LyricTuneHotkeys />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={chromeKeyClass({
              playing,
              lit: litKey === 'shuffle',
            })}
            aria-label="Перемешать заново"
            title="Перемешать заново"
            onPointerDown={() => {
              setLitKey('shuffle');
            }}
            onPointerUp={() => {
              setLitKey(null);
            }}
            onPointerCancel={() => {
              setLitKey(null);
            }}
            onClick={(event) => {
              event.stopPropagation();
              suppressToggle();
              void (async () => {
                const saved = await saveSnapshot();
                if (!saved) {
                  return;
                }

                resetToCatalog();
                setSortMode('shuffle');
              })();
            }}
          >
            <Shuffle className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={chromeKeyClass({
              playing,
              lit: litKey === 'history',
            })}
            aria-label="История"
            title="История"
            onPointerDown={() => {
              setLitKey('history');
            }}
            onPointerUp={() => {
              setLitKey(null);
            }}
            onPointerCancel={() => {
              setLitKey(null);
            }}
            onClick={(event) => {
              event.stopPropagation();
              suppressToggle();
              openSection('history');
            }}
          >
            <History className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={chromeKeyClass({
              playing,
              lit: litKey === 'settings',
            })}
            aria-label="Настройки"
            aria-expanded={isOpen}
            onPointerDown={() => {
              setLitKey('settings');
            }}
            onPointerUp={() => {
              setLitKey(null);
            }}
            onPointerCancel={() => {
              setLitKey(null);
            }}
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(true);
            }}
          >
            <Settings className="size-6" />
          </Button>
        </div>
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
            'min-h-0 min-w-0 max-w-full overflow-hidden md:max-h-[min(85svh,760px)] md:max-w-2xl md:p-6',
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
          <FilterPanel checkIngest={isOpen} />
        </DrawerContent>
      </Drawer>
    </>
  );
};
