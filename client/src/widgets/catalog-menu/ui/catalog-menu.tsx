'use client';

import {
  AudioLines,
  Bookmark,
  Bot,
  History,
  PanelLeft,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { CatalogDemosPanel } from '@/features/catalog-demos';
import { CatalogFavoritesPanel } from '@/features/catalog-favorites';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { useSwipeFromLeftEdge } from '@/shared/lib/swipe/use-swipe-from-left-edge';
import { cn } from '@/shared/lib/utils/cn';
import { CatalogPanel } from '@/shared/ui/catalog-panel/catalog-panel';
import { Button } from '@/shared/ui/shadcn/ui/button';

type CatalogSection = 'favorites' | 'demos';

type MenuItem = {
  id: CatalogSection | 'references' | 'generations' | 'ai-settings';
  label: string;
  icon: typeof Bookmark;
  disabled?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'favorites', label: 'Избранное', icon: Bookmark },
  { id: 'demos', label: 'Тексты из демок', icon: AudioLines },
  { id: 'references', label: 'Эталоны', icon: Sparkles, disabled: true },
  {
    id: 'generations',
    label: 'История генераций',
    icon: History,
    disabled: true,
  },
  { id: 'ai-settings', label: 'Настройки ИИ', icon: Bot, disabled: true },
];

export function CatalogMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<CatalogSection | null>(
    null
  );
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const { suppressToggle, beginOverlay, endOverlay } = usePlayback();

  const closeMenu = () => {
    suppressToggle();
    setIsOpen(false);
    document.body.style.removeProperty('pointer-events');
  };

  const openMenu = () => {
    suppressToggle();
    setIsOpen(true);
  };

  const swipeFromEdge = useSwipeFromLeftEdge({
    enabled: !isOpen,
    onOpen: openMenu,
  });

  useEffect(() => {
    if (isOpen) {
      beginOverlay();
      return () => {
        endOverlay();
      };
    }

    setActiveSection(null);
    setSelectedDemo(null);
    document.body.style.removeProperty('pointer-events');
  }, [beginOverlay, endOverlay, isOpen]);

  const openSection = (section: CatalogSection) => {
    setActiveSection(section);
    setSelectedDemo(null);
  };

  const panelTitle =
    activeSection === 'favorites'
      ? 'Избранное'
      : activeSection === 'demos'
        ? 'Тексты из демок'
        : null;

  return (
    <>
      <div
        aria-hidden
        className={cn(
          'fixed inset-y-0 left-0 z-20 w-8 touch-none',
          isOpen && 'pointer-events-none'
        )}
        {...swipeFromEdge.edgeProps}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      />

      <div className="pointer-events-none fixed bottom-0 left-0 z-30 p-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="pointer-events-auto text-muted-foreground hover:text-foreground"
          aria-label="Каталог"
          aria-expanded={isOpen}
          onClick={(event) => {
            event.stopPropagation();
            openMenu();
          }}
        >
          <PanelLeft className="size-6" />
        </Button>
      </div>

      <CatalogPanel
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeMenu();
            return;
          }

          setIsOpen(true);
        }}
        onPointerDownOutside={() => {
          suppressToggle();
        }}
      >
        <div className="flex h-full min-h-0 w-full">
          <nav
            data-swipe-ignore
            className={cn(
              'border-border flex w-44 shrink-0 flex-col gap-1 border-r p-3',
              activeSection && 'hidden sm:flex'
            )}
            aria-label="Разделы каталога"
          >
            {MENU_ITEMS.map(({ id, label, icon: Icon, disabled }) => {
              const isActive = activeSection === id;

              return (
                <Button
                  key={id}
                  type="button"
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'h-auto justify-start gap-2 px-2 py-2 text-left text-sm font-normal',
                    disabled &&
                      'text-muted-foreground pointer-events-none opacity-50'
                  )}
                  aria-disabled={disabled}
                  disabled={disabled}
                  onClick={() => {
                    if (
                      disabled ||
                      id === 'references' ||
                      id === 'generations' ||
                      id === 'ai-settings'
                    ) {
                      return;
                    }

                    openSection(id);
                  }}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="leading-snug">{label}</span>
                </Button>
              );
            })}
          </nav>

          <div
            className={cn(
              'flex min-h-0 min-w-0 flex-1 flex-col',
              !activeSection && 'hidden sm:flex'
            )}
          >
            {activeSection ? (
              <>
                <div className="border-border flex items-center gap-2 border-b px-4 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="sm:hidden"
                    onClick={() => {
                      if (activeSection === 'demos' && selectedDemo) {
                        setSelectedDemo(null);
                        return;
                      }

                      setActiveSection(null);
                    }}
                  >
                    Назад
                  </Button>
                  <h2 className="text-sm font-medium">{panelTitle}</h2>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {activeSection === 'favorites' ? (
                    <CatalogFavoritesPanel />
                  ) : (
                    <CatalogDemosPanel
                      selectedDemo={selectedDemo}
                      onSelectDemo={setSelectedDemo}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground hidden flex-1 items-center justify-center p-6 text-center text-sm sm:flex">
                Выберите раздел
              </div>
            )}
          </div>
        </div>
      </CatalogPanel>
    </>
  );
}
