'use client';

import { Heart, History, Settings, Shuffle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CarouselLikesPanel } from '@/features/carousel-session-likes';
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
  const [likesOpen, setLikesOpen] = useState(false);
  const [litKey, setLitKey] = useState<
    'shuffle' | 'likes' | 'history' | 'settings' | null
  >(null);
  const { setSortMode } = useLyricView();
  const { resetToCatalog, likedLines } = useCarouselSession();
  const { openSection } = useCatalogMenu();
  const { paused, canPlay, suppressToggle, beginOverlay, endOverlay } =
    usePlayback();
  const playing = !paused && canPlay;
  const likeCount = likedLines.length;

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
              resetToCatalog();
              setSortMode('shuffle');
            }}
          >
            <Shuffle className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              chromeKeyClass({
                playing,
                lit: litKey === 'likes',
              }),
              'relative'
            )}
            aria-label="Лайкнутые"
            title="Лайкнутые"
            onPointerDown={() => {
              setLitKey('likes');
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
              setLikesOpen(true);
            }}
          >
            <Heart
              className={cn(
                'size-5',
                likeCount > 0 && 'fill-rose-400 text-rose-400'
              )}
            />
            {likeCount > 0 ? (
              <span className="bg-rose-500 text-white absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold">
                {likeCount > 99 ? '99+' : likeCount}
              </span>
            ) : null}
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

      <CarouselLikesPanel open={likesOpen} onOpenChange={setLikesOpen} />

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
