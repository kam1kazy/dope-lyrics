'use client';

import {
  AudioLines,
  Bookmark,
  Bot,
  History,
  List,
  ListFilter,
  PanelLeft,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { CatalogDemosPanel } from '@/features/catalog-demos';
import { CatalogFavoritesPanel } from '@/features/catalog-favorites';
import { CatalogFilterPane } from '@/features/catalog-filters';
import { CatalogListPanel } from '@/features/catalog-list';
import {
  type CatalogSectionFilters,
  DEFAULT_CATALOG_SECTION_FILTERS,
  hasActiveCatalogSectionFilters,
} from '@/shared/lib/catalog-section-filters';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { useSwipeFromLeftEdge } from '@/shared/lib/swipe/use-swipe-from-left-edge';
import { chromeKeyClass } from '@/shared/lib/utils/chrome-key-class';
import { cn } from '@/shared/lib/utils/cn';
import { CatalogPanel } from '@/shared/ui/catalog-panel/catalog-panel';
import { Button } from '@/shared/ui/shadcn/ui/button';

type CatalogSection = 'list' | 'favorites' | 'demos';

type MenuItem = {
  id: CatalogSection | 'references' | 'generations' | 'ai-settings';
  label: string;
  icon: typeof Bookmark;
  disabled?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'list', label: 'Список', icon: List },
  { id: 'favorites', label: 'Избранное', icon: Bookmark },
  { id: 'demos', label: 'Тексты из демок', icon: AudioLines },
  { id: 'references', label: 'Эталоны', icon: Sparkles, disabled: true },
  {
    id: 'generations',
    label: 'История',
    icon: History,
    disabled: true,
  },
  { id: 'ai-settings', label: 'Настройки ИИ', icon: Bot, disabled: true },
];

const SECTION_TITLES: Record<CatalogSection, string> = {
  list: 'Список',
  favorites: 'Избранное',
  demos: 'Тексты из демок',
};

const EMPTY_SECTION_FILTERS: Record<CatalogSection, CatalogSectionFilters> = {
  list: { ...DEFAULT_CATALOG_SECTION_FILTERS },
  favorites: { ...DEFAULT_CATALOG_SECTION_FILTERS },
  demos: { ...DEFAULT_CATALOG_SECTION_FILTERS },
};

export function CatalogMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<CatalogSection | null>(
    null
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersBySection, setFiltersBySection] = useState(
    EMPTY_SECTION_FILTERS
  );
  const { paused, canPlay, suppressToggle, beginOverlay, endOverlay } =
    usePlayback();
  const [catalogLit, setCatalogLit] = useState(false);
  const playing = !paused && canPlay;

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
    setFiltersOpen(false);
    document.body.style.removeProperty('pointer-events');
  }, [beginOverlay, endOverlay, isOpen]);

  const openSection = (section: CatalogSection) => {
    setActiveSection(section);
    setFiltersOpen(false);
  };

  const sectionFilters = activeSection
    ? filtersBySection[activeSection]
    : DEFAULT_CATALOG_SECTION_FILTERS;
  const sectionHasFilters = activeSection
    ? hasActiveCatalogSectionFilters(filtersBySection[activeSection])
    : false;

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
          className={chromeKeyClass({ playing, lit: catalogLit })}
          aria-label="Каталог"
          aria-expanded={isOpen}
          onPointerDown={() => {
            setCatalogLit(true);
          }}
          onPointerUp={() => {
            setCatalogLit(false);
          }}
          onPointerCancel={() => {
            setCatalogLit(false);
          }}
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
        className={
          filtersOpen ? 'max-w-[min(100%,60rem)]' : 'max-w-[min(100%,640px)]'
        }
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
                      if (filtersOpen) {
                        setFiltersOpen(false);
                        return;
                      }

                      setActiveSection(null);
                    }}
                  >
                    Назад
                  </Button>
                  <h2 className="text-sm font-medium">
                    {SECTION_TITLES[activeSection]}
                  </h2>
                  <Button
                    type="button"
                    variant={filtersOpen ? 'secondary' : 'ghost'}
                    size="icon"
                    className="relative ml-auto size-8"
                    aria-label="Фильтры"
                    aria-pressed={filtersOpen}
                    onClick={() => {
                      setFiltersOpen((open) => !open);
                    }}
                  >
                    <ListFilter className="size-4" />
                    {sectionHasFilters ? (
                      <span
                        className="bg-primary absolute top-1.5 right-1.5 size-1.5 rounded-full"
                        aria-hidden
                      />
                    ) : null}
                  </Button>
                </div>

                <div className="relative flex min-h-0 flex-1 overflow-hidden">
                  <div
                    className="min-h-0 min-w-0 flex-1 overflow-y-auto"
                    data-lyrics-scroll
                  >
                    {activeSection === 'list' ? (
                      <CatalogListPanel filters={sectionFilters} />
                    ) : activeSection === 'favorites' ? (
                      <CatalogFavoritesPanel filters={sectionFilters} />
                    ) : (
                      <CatalogDemosPanel filters={sectionFilters} />
                    )}
                  </div>

                  <div
                    data-swipe-ignore
                    className={cn(
                      'border-border bg-background min-h-0 overflow-hidden',
                      'max-sm:absolute max-sm:inset-0 max-sm:z-10 max-sm:transition-transform max-sm:duration-300 max-sm:ease-out',
                      'sm:shrink-0 sm:transition-[width] sm:duration-300 sm:ease-out',
                      filtersOpen
                        ? 'max-sm:translate-x-0 sm:w-80 sm:border-l'
                        : 'pointer-events-none max-sm:translate-x-full sm:w-0 sm:border-l-transparent'
                    )}
                  >
                    <div className="h-full w-full sm:w-80">
                      <CatalogFilterPane
                        sectionId={activeSection}
                        filters={sectionFilters}
                        onChange={(next) => {
                          setFiltersBySection((current) => ({
                            ...current,
                            [activeSection]: next,
                          }));
                        }}
                      />
                    </div>
                  </div>
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
