'use client';

import {
  AudioLines,
  Bookmark,
  Bot,
  ChartColumn,
  History,
  List,
  ListFilter,
  PanelLeft,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { ILyricCollage, TrackFormQuotas } from '@/entities/lyric';
import {
  CatalogAssembleHistory,
  CatalogAssemblePanel,
  CatalogGeneratorPane,
  DEFAULT_TRACK_FORM_QUOTAS,
  quotasEqual,
  readGeneratorForm,
  writeGeneratorForm,
} from '@/features/catalog-assemble';
import { CatalogDemosPanel } from '@/features/catalog-demos';
import { CatalogFavoritesPanel } from '@/features/catalog-favorites';
import { CatalogFilterPane } from '@/features/catalog-filters';
import { CatalogListPanel } from '@/features/catalog-list';
import { CatalogStatsPanel } from '@/features/catalog-stats';
import {
  type CatalogSectionFilters,
  DEFAULT_CATALOG_SECTION_FILTERS,
  DEFAULT_GENERATOR_SECTION_FILTERS,
  DEFAULT_LIST_SECTION_FILTERS,
  hasActiveCatalogSectionFilters,
} from '@/shared/lib/catalog-section-filters';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { useSwipeFromLeftEdge } from '@/shared/lib/swipe/use-swipe-from-left-edge';
import { chromeKeyClass } from '@/shared/lib/utils/chrome-key-class';
import { cn } from '@/shared/lib/utils/cn';
import { CatalogPanel } from '@/shared/ui/catalog-panel/catalog-panel';
import { Button } from '@/shared/ui/shadcn/ui/button';

type CatalogSection = 'list' | 'favorites' | 'demos' | 'stats' | 'generator';

type FilterableSection = Exclude<CatalogSection, 'stats' | 'generator'>;

type MenuItem = {
  id: CatalogSection | 'references' | 'ai-settings';
  label: string;
  icon: typeof Bookmark;
  disabled?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'list', label: 'Список', icon: List },
  { id: 'favorites', label: 'Избранное', icon: Bookmark },
  { id: 'demos', label: 'Тексты из демок', icon: AudioLines },
  { id: 'stats', label: 'Сводка', icon: ChartColumn },
  { id: 'references', label: 'Эталоны', icon: Sparkles, disabled: true },
  { id: 'generator', label: 'Генератор', icon: Shuffle },
  { id: 'ai-settings', label: 'Настройки ИИ', icon: Bot, disabled: true },
];

const SECTION_TITLES: Record<CatalogSection, string> = {
  list: 'Список',
  favorites: 'Избранное',
  demos: 'Тексты из демок',
  stats: 'Сводка',
  generator: 'Генератор',
};

const EMPTY_SECTION_FILTERS: Record<FilterableSection, CatalogSectionFilters> =
  {
    list: { ...DEFAULT_LIST_SECTION_FILTERS },
    favorites: { ...DEFAULT_CATALOG_SECTION_FILTERS },
    demos: { ...DEFAULT_CATALOG_SECTION_FILTERS },
  };

const SECTION_ANIMATION_MS = 200;
const SECTION_TOGGLE_GUARD_MS = 500;

export function CatalogMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<CatalogSection | null>(
    null
  );
  const [renderedSection, setRenderedSection] = useState<CatalogSection | null>(
    null
  );
  const activeSectionRef = useRef<CatalogSection | null>(null);
  const sectionToggleGuardUntilRef = useRef(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [generatorForm, setGeneratorForm] = useState<TrackFormQuotas>(
    DEFAULT_TRACK_FORM_QUOTAS
  );
  const [hideAdlibs, setHideAdlibs] = useState(false);
  const [generatorFilters, setGeneratorFilters] =
    useState<CatalogSectionFilters>(DEFAULT_GENERATOR_SECTION_FILTERS);
  const [selectedCollage, setSelectedCollage] = useState<ILyricCollage | null>(
    null
  );
  const [filtersBySection, setFiltersBySection] = useState(
    EMPTY_SECTION_FILTERS
  );
  const { paused, canPlay, suppressToggle, beginOverlay, endOverlay } =
    usePlayback();
  const [catalogLit, setCatalogLit] = useState(false);
  const playing = !paused && canPlay;

  useEffect(() => {
    setGeneratorForm(readGeneratorForm());
  }, []);

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

    activeSectionRef.current = null;
    setActiveSection(null);
    setFiltersOpen(false);
    setHistoryOpen(false);
    setSelectedCollage(null);
    document.body.style.removeProperty('pointer-events');
  }, [beginOverlay, endOverlay, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setRenderedSection(null);
      return;
    }

    if (activeSection) {
      setRenderedSection(activeSection);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRenderedSection(null);
    }, SECTION_ANIMATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeSection, isOpen]);

  const selectSection = (section: CatalogSection) => {
    const now = Date.now();
    const current = activeSectionRef.current;
    const changesWidth = current === null || current === section;

    if (changesWidth && now < sectionToggleGuardUntilRef.current) {
      return;
    }

    if (current === section) {
      sectionToggleGuardUntilRef.current = now + SECTION_TOGGLE_GUARD_MS;
      activeSectionRef.current = null;
      setActiveSection(null);
      setFiltersOpen(false);
      setHistoryOpen(false);
      return;
    }

    if (current === null) {
      sectionToggleGuardUntilRef.current = now + SECTION_TOGGLE_GUARD_MS;
    }

    activeSectionRef.current = section;
    setActiveSection(section);
    setRenderedSection(section);
    setFiltersOpen(false);
    setHistoryOpen(false);
  };

  const filterableSection: FilterableSection | null =
    renderedSection &&
    renderedSection !== 'stats' &&
    renderedSection !== 'generator'
      ? renderedSection
      : null;
  const sectionDefaults =
    filterableSection === 'list'
      ? DEFAULT_LIST_SECTION_FILTERS
      : DEFAULT_CATALOG_SECTION_FILTERS;
  const sectionFilters = filterableSection
    ? filtersBySection[filterableSection]
    : DEFAULT_CATALOG_SECTION_FILTERS;
  const sectionHasFilters = filterableSection
    ? hasActiveCatalogSectionFilters(
        filtersBySection[filterableSection],
        sectionDefaults
      )
    : false;
  const generatorHasSettings =
    !quotasEqual(generatorForm, DEFAULT_TRACK_FORM_QUOTAS) ||
    hideAdlibs ||
    hasActiveCatalogSectionFilters(
      generatorFilters,
      DEFAULT_GENERATOR_SECTION_FILTERS
    );
  const sidePaneOpen = filtersOpen || historyOpen;

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
          sidePaneOpen
            ? 'max-w-[min(100%,60rem)]'
            : activeSection
              ? 'max-w-[min(100%,640px)]'
              : 'max-w-48'
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
        <div className="flex h-full min-h-0 w-full overflow-hidden">
          <nav
            data-swipe-ignore
            className={cn(
              'border-border flex h-full w-48 shrink-0 flex-col gap-1 border-r p-3 select-none',
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
                    'h-auto justify-start gap-2 py-2 pr-2 pl-2 text-left text-sm font-normal whitespace-normal has-[>svg]:pr-3 has-[>svg]:pl-2',
                    disabled &&
                      'text-muted-foreground pointer-events-none opacity-50'
                  )}
                  aria-disabled={disabled}
                  disabled={disabled}
                  aria-pressed={isActive}
                  onClick={() => {
                    if (
                      disabled ||
                      id === 'references' ||
                      id === 'ai-settings'
                    ) {
                      return;
                    }

                    selectSection(id);
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
              'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
              !renderedSection && 'hidden',
              !activeSection && 'max-sm:hidden'
            )}
          >
            {renderedSection ? (
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

                      if (historyOpen) {
                        setHistoryOpen(false);
                        return;
                      }

                      activeSectionRef.current = null;
                      setActiveSection(null);
                    }}
                  >
                    назад
                  </Button>
                  <h2 className="text-sm font-medium">
                    {SECTION_TITLES[renderedSection]}
                  </h2>
                  {renderedSection === 'generator' ? (
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        type="button"
                        variant={historyOpen ? 'secondary' : 'ghost'}
                        size="icon"
                        className="size-8"
                        aria-label="История"
                        aria-pressed={historyOpen}
                        onClick={() => {
                          setHistoryOpen((open) => !open);
                          setFiltersOpen(false);
                        }}
                      >
                        <History className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={filtersOpen ? 'secondary' : 'ghost'}
                        size="icon"
                        className="relative size-8"
                        aria-label="Фильтры"
                        aria-pressed={filtersOpen}
                        onClick={() => {
                          setFiltersOpen((open) => !open);
                          setHistoryOpen(false);
                        }}
                      >
                        <ListFilter className="size-4" />
                        {generatorHasSettings ? (
                          <span
                            className="bg-primary absolute top-1.5 right-1.5 size-1.5 rounded-full"
                            aria-hidden
                          />
                        ) : null}
                      </Button>
                    </div>
                  ) : null}
                  {filterableSection ? (
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
                  ) : null}
                </div>

                <div className="relative flex min-h-0 flex-1 overflow-hidden">
                  <div
                    className="min-h-0 min-w-0 flex-1 overflow-y-auto"
                    data-lyrics-scroll
                  >
                    {renderedSection === 'list' ? (
                      <CatalogListPanel filters={sectionFilters} />
                    ) : renderedSection === 'favorites' ? (
                      <CatalogFavoritesPanel filters={sectionFilters} />
                    ) : renderedSection === 'demos' ? (
                      <CatalogDemosPanel filters={sectionFilters} />
                    ) : renderedSection === 'generator' ? (
                      <CatalogAssemblePanel
                        form={generatorForm}
                        hideAdlibs={hideAdlibs}
                        filters={generatorFilters}
                        selectedCollage={selectedCollage}
                        onCloseSelected={() => {
                          setSelectedCollage(null);
                        }}
                      />
                    ) : (
                      <CatalogStatsPanel />
                    )}
                  </div>

                  <div
                    data-swipe-ignore
                    className={cn(
                      'border-border bg-background flex min-h-0 flex-col overflow-hidden',
                      'max-sm:absolute max-sm:inset-0 max-sm:z-10 max-sm:transition-transform max-sm:duration-200 max-sm:ease-out',
                      'sm:shrink-0 sm:transition-[width] sm:duration-200 sm:ease-out',
                      sidePaneOpen
                        ? 'max-sm:translate-x-0 sm:w-80 sm:border-l'
                        : 'pointer-events-none max-sm:translate-x-full sm:w-0 sm:border-l-transparent'
                    )}
                  >
                    <div className="flex h-0 min-h-0 w-full flex-1 flex-col overflow-y-auto sm:w-80">
                      {renderedSection === 'generator' && historyOpen ? (
                        <CatalogAssembleHistory
                          hideAdlibs={hideAdlibs}
                          selectedId={selectedCollage?.id ?? null}
                          onSelect={(collage) => {
                            setSelectedCollage(collage);
                            if (
                              typeof window !== 'undefined' &&
                              window.matchMedia('(max-width: 639px)').matches
                            ) {
                              setHistoryOpen(false);
                            }
                          }}
                        />
                      ) : renderedSection === 'generator' ? (
                        <CatalogGeneratorPane
                          form={generatorForm}
                          hideAdlibs={hideAdlibs}
                          filters={generatorFilters}
                          onFormChange={(next) => {
                            setGeneratorForm(next);
                            writeGeneratorForm(next);
                          }}
                          onHideAdlibsChange={setHideAdlibs}
                          onFiltersChange={setGeneratorFilters}
                        />
                      ) : (
                        <CatalogFilterPane
                          sectionId={filterableSection ?? 'list'}
                          filters={sectionFilters}
                          hideSort={filterableSection === 'list'}
                          showShelves={filterableSection === 'list'}
                          shelfVariant="icons"
                          shelvesFirst
                          defaults={sectionDefaults}
                          onChange={(next) => {
                            if (!filterableSection) {
                              return;
                            }

                            setFiltersBySection((current) => ({
                              ...current,
                              [filterableSection]: next,
                            }));
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </CatalogPanel>
    </>
  );
}
