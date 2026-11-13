'use client';

import { useQuery } from '@apollo/client/react';
import {
  AudioLines,
  Bookmark,
  Bot,
  ChartColumn,
  FileText,
  Heart,
  History,
  List,
  ListFilter,
  PanelLeft,
  Search,
  Shuffle,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import type { ILyric, ILyricCollage, TrackFormQuotas } from '@/entities/lyric';
import { AiSettingsPanel } from '@/features/ai-settings';
import { CarouselHistoryPanel } from '@/features/carousel-history';
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
import {
  SectionSearchBox,
  type SectionSearchHit,
} from '@/features/catalog-search';
import { CatalogStatsPanel } from '@/features/catalog-stats';
import { FromScratchPage } from '@/features/from-scratch';
import { ArtistList, ArtistPane } from '@/features/reference-shelf';
import { TrackTextsList, TrackTextView } from '@/features/track-texts';
import {
  type IProfile,
  PROFILE,
  UserProfilePanel,
} from '@/features/user-profile';
import {
  apolloClient,
  AUTH_SIGNED_OUT_EVENT,
  logoutSession,
} from '@/shared/api';
import {
  type CatalogMenuSection,
  useCatalogMenu,
} from '@/shared/lib/catalog-menu/catalog-menu-context';
import {
  type CatalogSectionFilters,
  DEFAULT_CATALOG_SECTION_FILTERS,
  DEFAULT_GENERATOR_SECTION_FILTERS,
  DEFAULT_LIST_SECTION_FILTERS,
  hasActiveCatalogSectionFilters,
} from '@/shared/lib/catalog-section-filters';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import {
  EMPTY_REFERENCE_FILTER,
  hasReferenceFilter,
  type ReferenceFilter,
} from '@/shared/lib/reference-filter';
import { useSwipeFromLeftEdge } from '@/shared/lib/swipe/use-swipe-from-left-edge';
import { chromeKeyClass } from '@/shared/lib/utils/chrome-key-class';
import { cn } from '@/shared/lib/utils/cn';
import { CatalogPanel } from '@/shared/ui/catalog-panel/catalog-panel';
import { Hint } from '@/shared/ui/hint';
import { Button } from '@/shared/ui/shadcn/ui/button';

import { CatalogNavUser } from './catalog-nav-user';

type CatalogSection = CatalogMenuSection;

type FilterableSection = Exclude<
  CatalogSection,
  | 'profile'
  | 'generator'
  | 'from-scratch'
  | 'history'
  | 'references'
  | 'ai-settings'
>;

type MenuItem = {
  id: CatalogSection;
  label: string;
  icon: typeof Bookmark;
  disabled?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'list', label: 'Список', icon: List },
  { id: 'favorites', label: 'Избранное', icon: Bookmark },
  { id: 'demos', label: 'Тексты из демок', icon: AudioLines },
  { id: 'history', label: 'История', icon: History },
  { id: 'stats', label: 'Сводка', icon: ChartColumn },
  { id: 'references', label: 'Эталоны', icon: Sparkles },
  { id: 'generator', label: 'Генератор', icon: Shuffle },
  { id: 'from-scratch', label: 'С нуля', icon: WandSparkles },
  { id: 'ai-settings', label: 'Настройки ИИ', icon: Bot },
];

const SECTION_TITLES: Record<CatalogSection, string> = {
  profile: 'Профиль',
  list: 'Список',
  favorites: 'Избранное',
  demos: 'Тексты из демок',
  history: 'История карусели',
  stats: 'Сводка',
  generator: 'Генератор',
  'from-scratch': 'С нуля',
  references: 'Эталоны',
  'ai-settings': 'Настройки ИИ',
};

const EMPTY_SECTION_FILTERS: Record<FilterableSection, CatalogSectionFilters> =
  {
    list: { ...DEFAULT_LIST_SECTION_FILTERS },
    favorites: { ...DEFAULT_CATALOG_SECTION_FILTERS },
    demos: { ...DEFAULT_CATALOG_SECTION_FILTERS },
    stats: { ...DEFAULT_CATALOG_SECTION_FILTERS },
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
  const [textsOpen, setTextsOpen] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<number | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const { data: profileData } = useQuery<{ profile: IProfile }>(PROFILE);
  const isOwner = profileData?.profile.role === 'OWNER';
  const [likedOnly, setLikedOnly] = useState(false);
  const [generatorForm, setGeneratorForm] = useState<TrackFormQuotas>(
    DEFAULT_TRACK_FORM_QUOTAS
  );
  const [hideAdlibs, setHideAdlibs] = useState(false);
  const [generatorFilters, setGeneratorFilters] =
    useState<CatalogSectionFilters>(DEFAULT_GENERATOR_SECTION_FILTERS);
  const [generatorReferences, setGeneratorReferences] =
    useState<ReferenceFilter>(EMPTY_REFERENCE_FILTER);
  const [scratchReferences, setScratchReferences] = useState<ReferenceFilter>(
    EMPTY_REFERENCE_FILTER
  );
  const [selectedCollage, setSelectedCollage] = useState<ILyricCollage | null>(
    null
  );
  const [filtersBySection, setFiltersBySection] = useState(
    EMPTY_SECTION_FILTERS
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lyricOpenRequest, setLyricOpenRequest] = useState<{
    token: number;
    lyric: ILyric;
  } | null>(null);
  const lyricOpenToken = useRef(0);
  const { paused, canPlay, suppressToggle, beginOverlay, endOverlay } =
    usePlayback();
  const { openRequest, closeSignal, consumeOpenRequest } = useCatalogMenu();
  const [catalogLit, setCatalogLit] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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

  const openMenuFromEffect = useEffectEvent(openMenu);
  const closeMenuFromEffect = useEffectEvent(closeMenu);

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
    setSelectedArtistId(null);
    setLikedOnly(false);
    setSearchOpen(false);
    setSearchQuery('');
    setLyricOpenRequest(null);
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

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const consumeLyricOpen = useCallback(() => {
    setLyricOpenRequest(null);
  }, []);

  const pickSearchHit = (hit: SectionSearchHit) => {
    if (hit.kind === 'lyric') {
      lyricOpenToken.current += 1;
      setLyricOpenRequest({
        token: lyricOpenToken.current,
        lyric: hit.lyric,
      });
    } else if (hit.kind === 'favorite') {
      setSelectedTextId(null);
      setSelectedCollage(hit.collage);
      setHistoryOpen(false);
      setTextsOpen(false);
      setFiltersOpen(false);
    } else {
      setSelectedTextId(hit.id);
      setHistoryOpen(false);
      setTextsOpen(false);
      setFiltersOpen(false);
    }

    closeSearch();
  };

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
      setTextsOpen(false);
      setSelectedArtistId(null);
      closeSearch();
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
    setTextsOpen(false);
    setSelectedArtistId(null);
    closeSearch();
  };

  useEffect(() => {
    if (!openRequest) {
      return;
    }

    openMenuFromEffect();
    activeSectionRef.current = openRequest;
    setActiveSection(openRequest);
    setRenderedSection(openRequest);
    setFiltersOpen(false);
    setHistoryOpen(false);
    setTextsOpen(false);
    setSearchOpen(false);
    setSearchQuery('');
    consumeOpenRequest();
  }, [consumeOpenRequest, openRequest]);

  useEffect(() => {
    if (closeSignal === 0) {
      return;
    }

    closeMenuFromEffect();
  }, [closeSignal]);

  const filterableSection: FilterableSection | null =
    renderedSection &&
    renderedSection !== 'profile' &&
    renderedSection !== 'generator' &&
    renderedSection !== 'from-scratch' &&
    renderedSection !== 'history' &&
    renderedSection !== 'references' &&
    renderedSection !== 'ai-settings'
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
    (isOwner && hasReferenceFilter(generatorReferences)) ||
    hasActiveCatalogSectionFilters(
      generatorFilters,
      DEFAULT_GENERATOR_SECTION_FILTERS
    );
  const artistOpen =
    renderedSection === 'references' && selectedArtistId !== null;
  const sidePaneOpen = filtersOpen || historyOpen || textsOpen || artistOpen;
  const visibleMenuItems = MENU_ITEMS.filter(
    (item) =>
      (item.id !== 'ai-settings' &&
        item.id !== 'references' &&
        item.id !== 'from-scratch') ||
      isOwner
  );

  const handleLogout = () => {
    if (loggingOut) {
      return;
    }

    void (async () => {
      setLoggingOut(true);
      await logoutSession();
      try {
        await apolloClient.clearStore();
      } catch {
        // ignore in-flight queries
      }
      window.dispatchEvent(new Event(AUTH_SIGNED_OUT_EVENT));
    })();
  };

  const searchSection =
    renderedSection === 'list' ||
    renderedSection === 'demos' ||
    renderedSection === 'generator'
      ? renderedSection
      : null;
  const searchButton = searchSection ? (
    <Hint label="Поиск">
      <Button
        type="button"
        variant={searchOpen ? 'secondary' : 'ghost'}
        size="icon"
        className="size-8"
        aria-label="Поиск"
        aria-pressed={searchOpen}
        onClick={() => {
          if (searchOpen) {
            closeSearch();
            return;
          }

          setSearchOpen(true);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <Search className="size-4" />
      </Button>
    </Hint>
  ) : null;

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
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              {visibleMenuItems.map(({ id, label, icon: Icon, disabled }) => {
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
                      if (disabled) {
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
            </div>

            <CatalogNavUser
              active={activeSection === 'profile'}
              loggingOut={loggingOut}
              onOpenProfile={() => {
                if (activeSectionRef.current !== 'profile') {
                  selectSection('profile');
                }
              }}
              onLogout={handleLogout}
            />
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
                <div className="border-border relative z-20 flex items-center gap-2 border-b px-4 py-3">
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

                      if (textsOpen) {
                        setTextsOpen(false);
                        return;
                      }

                      if (artistOpen) {
                        setSelectedArtistId(null);
                        return;
                      }

                      activeSectionRef.current = null;
                      setActiveSection(null);
                      closeSearch();
                    }}
                  >
                    назад
                  </Button>
                  {searchOpen && searchSection ? (
                    <SectionSearchBox
                      section={searchSection}
                      query={searchQuery}
                      filters={sectionFilters}
                      includeSavedTexts={isOwner}
                      onQueryChange={setSearchQuery}
                      onClose={closeSearch}
                      onPick={pickSearchHit}
                    />
                  ) : (
                    <h2 className="min-w-0 truncate text-sm font-medium">
                      {SECTION_TITLES[renderedSection]}
                    </h2>
                  )}
                  {renderedSection === 'history' ? (
                    <Hint label="Только сохранённые">
                      <Button
                        type="button"
                        variant={likedOnly ? 'secondary' : 'ghost'}
                        size="icon"
                        className="ml-auto size-8"
                        aria-label="Сохранённые"
                        aria-pressed={likedOnly}
                        onClick={() => {
                          setLikedOnly((open) => !open);
                        }}
                      >
                        <Heart
                          className={cn(
                            'size-4',
                            likedOnly && 'fill-rose-400 text-rose-400'
                          )}
                        />
                      </Button>
                    </Hint>
                  ) : null}
                  {renderedSection === 'generator' ? (
                    <div
                      className={cn(
                        'flex shrink-0 items-center gap-1',
                        !(searchOpen && searchSection) && 'ml-auto'
                      )}
                    >
                      <Hint label="Избранные">
                        <Button
                          type="button"
                          variant={historyOpen ? 'secondary' : 'ghost'}
                          size="icon"
                          className="size-8"
                          aria-label="Избранные"
                          aria-pressed={historyOpen}
                          onClick={() => {
                            setHistoryOpen((open) => !open);
                            setFiltersOpen(false);
                            setTextsOpen(false);
                          }}
                        >
                          <Heart className="size-4" />
                        </Button>
                      </Hint>
                      {isOwner ? (
                        <Hint label="Сохранённые тексты">
                          <Button
                            type="button"
                            variant={textsOpen ? 'secondary' : 'ghost'}
                            size="icon"
                            className="size-8"
                            aria-label="Тексты"
                            aria-pressed={textsOpen}
                            onClick={() => {
                              setTextsOpen((open) => !open);
                              setHistoryOpen(false);
                              setFiltersOpen(false);
                            }}
                          >
                            <FileText className="size-4" />
                          </Button>
                        </Hint>
                      ) : null}
                      {searchButton}
                      <Hint label="Фильтры">
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
                            setTextsOpen(false);
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
                      </Hint>
                    </div>
                  ) : null}
                  {filterableSection ? (
                    <div
                      className={cn(
                        'flex shrink-0 items-center gap-1',
                        !(searchOpen && searchSection) && 'ml-auto'
                      )}
                    >
                      {searchButton}
                      <Hint label="Фильтры">
                        <Button
                          type="button"
                          variant={filtersOpen ? 'secondary' : 'ghost'}
                          size="icon"
                          className="relative size-8"
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
                      </Hint>
                    </div>
                  ) : null}
                </div>

                <div className="relative flex min-h-0 flex-1 overflow-hidden">
                  <div
                    className={cn(
                      'min-h-0 min-w-0 flex-1',
                      renderedSection === 'generator'
                        ? 'flex flex-col overflow-hidden'
                        : 'overflow-y-auto'
                    )}
                    data-lyrics-scroll
                  >
                    {renderedSection === 'profile' ? (
                      <UserProfilePanel />
                    ) : renderedSection === 'list' ? (
                      <CatalogListPanel
                        filters={sectionFilters}
                        openRequest={lyricOpenRequest}
                        onOpenRequestConsumed={consumeLyricOpen}
                      />
                    ) : renderedSection === 'favorites' ? (
                      <CatalogFavoritesPanel filters={sectionFilters} />
                    ) : renderedSection === 'demos' ? (
                      <CatalogDemosPanel
                        filters={sectionFilters}
                        openRequest={lyricOpenRequest}
                        onOpenRequestConsumed={consumeLyricOpen}
                      />
                    ) : renderedSection === 'history' ? (
                      <CarouselHistoryPanel
                        likedOnly={likedOnly}
                        onPlay={closeMenu}
                      />
                    ) : renderedSection === 'from-scratch' && isOwner ? (
                      <FromScratchPage
                        form={generatorForm}
                        references={scratchReferences}
                        onFormChange={(next) => {
                          setGeneratorForm(next);
                          writeGeneratorForm(next);
                        }}
                        onReferencesChange={setScratchReferences}
                        onSaved={(id) => {
                          selectSection('generator');
                          setSelectedTextId(id);
                          setTextsOpen(true);
                        }}
                      />
                    ) : renderedSection === 'ai-settings' ? (
                      <AiSettingsPanel />
                    ) : renderedSection === 'references' ? (
                      <ArtistList
                        selectedId={selectedArtistId}
                        onOpen={setSelectedArtistId}
                      />
                    ) : renderedSection === 'generator' &&
                      isOwner &&
                      selectedTextId !== null ? (
                      <TrackTextView
                        id={selectedTextId}
                        onClose={() => {
                          setSelectedTextId(null);
                        }}
                        onApplySettings={(generation) => {
                          setGeneratorForm(generation.form);
                          writeGeneratorForm(generation.form);
                          setHideAdlibs(generation.hideAdlibs);
                          setGeneratorFilters(generation.filters);
                          setGeneratorReferences(generation.references);
                          setSelectedTextId(null);
                          toast.success('Настройки возвращены в генератор');
                        }}
                      />
                    ) : renderedSection === 'generator' ? (
                      <CatalogAssemblePanel
                        aiEnabled={isOwner}
                        onTextSaved={(id) => {
                          setSelectedTextId(id);
                          setTextsOpen(true);
                        }}
                        form={generatorForm}
                        hideAdlibs={hideAdlibs}
                        filters={generatorFilters}
                        references={generatorReferences}
                        selectedCollage={selectedCollage}
                        onCloseSelected={() => {
                          setSelectedCollage(null);
                        }}
                      />
                    ) : renderedSection === 'stats' ? (
                      <CatalogStatsPanel filters={sectionFilters} />
                    ) : null}
                  </div>

                  <div
                    data-swipe-ignore
                    className={cn(
                      'border-border bg-background flex min-h-0 flex-col overflow-hidden',
                      'max-sm:absolute max-sm:inset-0 max-sm:z-10 max-sm:transition-transform max-sm:duration-200 max-sm:ease-out',
                      'sm:shrink-0 sm:transition-[width] sm:duration-200 sm:ease-[cubic-bezier(0.32,0.72,0,1)]',
                      sidePaneOpen
                        ? cn(
                            'max-sm:translate-x-0 sm:border-l',
                            artistOpen ? 'sm:w-96' : 'sm:w-80'
                          )
                        : 'pointer-events-none max-sm:translate-x-full sm:w-0 sm:border-l-transparent'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-0 min-h-0 w-full flex-1 flex-col overflow-y-auto',
                        artistOpen ? 'sm:w-96' : 'sm:w-80'
                      )}
                    >
                      {artistOpen && selectedArtistId !== null ? (
                        <ArtistPane
                          key={selectedArtistId}
                          id={selectedArtistId}
                          onClose={() => {
                            setSelectedArtistId(null);
                          }}
                        />
                      ) : renderedSection === 'generator' && textsOpen ? (
                        <TrackTextsList
                          selectedId={selectedTextId}
                          onSelect={setSelectedTextId}
                        />
                      ) : renderedSection === 'generator' && historyOpen ? (
                        <CatalogAssembleHistory
                          hideAdlibs={hideAdlibs}
                          selectedId={selectedCollage?.id ?? null}
                          onSelect={(collage) => {
                            setSelectedTextId(null);
                            setSelectedCollage(collage);
                          }}
                          onDeleted={(id) => {
                            setSelectedCollage((current) =>
                              current?.id === id ? null : current
                            );
                          }}
                          onPlay={closeMenu}
                        />
                      ) : renderedSection === 'generator' ? (
                        <CatalogGeneratorPane
                          form={generatorForm}
                          hideAdlibs={hideAdlibs}
                          filters={generatorFilters}
                          references={generatorReferences}
                          showReferences={isOwner}
                          onFormChange={(next) => {
                            setGeneratorForm(next);
                            writeGeneratorForm(next);
                          }}
                          onHideAdlibsChange={setHideAdlibs}
                          onFiltersChange={setGeneratorFilters}
                          onReferencesChange={setGeneratorReferences}
                        />
                      ) : (
                        <CatalogFilterPane
                          sectionId={filterableSection ?? 'list'}
                          filters={sectionFilters}
                          hideSort={
                            filterableSection === 'list' ||
                            filterableSection === 'stats'
                          }
                          showShelves={
                            filterableSection === 'list' ||
                            filterableSection === 'stats'
                          }
                          showPeriodPresets={filterableSection === 'stats'}
                          showDateSort={filterableSection === 'list'}
                          hideLyricFields={filterableSection === 'stats'}
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
