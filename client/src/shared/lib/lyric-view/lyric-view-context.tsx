'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  LyricDelivery,
  LyricMood,
  LyricReadiness,
  LyricSongRole,
} from '@/shared/lib/lyric-facets';
import {
  DEFAULT_SHELF_SELECTION,
  isDefaultShelfSelection,
  type ShelfFlag,
  type ShelfSelection,
} from '@/shared/lib/lyric-view/shelf-filter';

export const SORT_MODES = ['shuffle', 'forward', 'reverse'] as const;

export type SortMode = (typeof SORT_MODES)[number];

export const LYRIC_VIEW_DEFAULTS = {
  sortMode: 'shuffle' as SortMode,
  includedShelves: DEFAULT_SHELF_SELECTION.included,
  excludedShelves: DEFAULT_SHELF_SELECTION.excluded,
  fontSize: 31,
  lineHeight: 1.45,
  lineGap: 2,
  carouselSpeed: 3,
  keyword: '',
  dateFrom: '',
  dateTo: '',
  mood: [] as LyricMood[],
  delivery: [] as LyricDelivery[],
  songRole: [] as LyricSongRole[],
  readiness: null as LyricReadiness | null,
};

const SETTINGS_STORAGE_KEY = 'dope-lyrics.lyric-settings';

type PersistedLyricSettings = {
  sortMode: SortMode;
  fontSize: number;
  lineHeight: number;
  lineGap: number;
  carouselSpeed: number;
};

function isSortMode(value: unknown): value is SortMode {
  return (
    typeof value === 'string' &&
    (SORT_MODES as readonly string[]).includes(value)
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nextShuffleSeed(current: number): number {
  const next = Date.now();

  return next === current ? current + 1 : next;
}

function parsePersistedSettings(raw: string): PersistedLyricSettings | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const record = parsed as Record<string, unknown>;

    if (
      !isSortMode(record.sortMode) ||
      typeof record.fontSize !== 'number' ||
      !Number.isFinite(record.fontSize) ||
      typeof record.lineHeight !== 'number' ||
      !Number.isFinite(record.lineHeight) ||
      typeof record.lineGap !== 'number' ||
      !Number.isFinite(record.lineGap) ||
      typeof record.carouselSpeed !== 'number' ||
      !Number.isFinite(record.carouselSpeed)
    ) {
      return null;
    }

    return {
      sortMode: record.sortMode,
      fontSize: clamp(Math.round(record.fontSize), 16, 36),
      lineHeight: clamp(record.lineHeight, 1.1, 1.9),
      lineGap: clamp(Number(record.lineGap.toFixed(2)), 1, 10),
      carouselSpeed: clamp(Math.round(record.carouselSpeed), 1, 10),
    };
  } catch {
    return null;
  }
}

function readPersistedSettings(): PersistedLyricSettings | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return parsePersistedSettings(raw);
  } catch {
    return null;
  }
}

function writePersistedSettings(settings: PersistedLyricSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    return;
  }
}

interface LyricViewContextValue {
  sortMode: SortMode;
  shuffleSeed: number;
  includedShelves: ShelfFlag[];
  excludedShelves: ShelfFlag[];
  fontSize: number;
  lineHeight: number;
  lineGap: number;
  carouselSpeed: number;
  selectedTags: string[];
  selectedEmojis: string[];
  keyword: string;
  dateFrom: string;
  dateTo: string;
  mood: LyricMood[];
  delivery: LyricDelivery[];
  songRole: LyricSongRole[];
  readiness: LyricReadiness | null;
  setSortMode: (mode: SortMode) => void;
  setShelfSelection: (
    selection: ShelfSelection | ((current: ShelfSelection) => ShelfSelection)
  ) => void;
  setFontSize: (value: number) => void;
  setLineHeight: (value: number) => void;
  setLineGap: (value: number) => void;
  setCarouselSpeed: (value: number) => void;
  toggleTag: (tag: string) => void;
  toggleEmoji: (emoji: string) => void;
  setKeyword: (value: string) => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  setMood: (value: LyricMood[]) => void;
  setDelivery: (value: LyricDelivery[]) => void;
  setSongRole: (value: LyricSongRole[]) => void;
  setReadiness: (value: LyricReadiness | null) => void;
  resetSettings: () => void;
  resetFilters: () => void;
}

const LyricViewContext = createContext<LyricViewContextValue | null>(null);

export function LyricViewProvider({ children }: { children: ReactNode }) {
  const [sortMode, setSortModeState] = useState<SortMode>(
    LYRIC_VIEW_DEFAULTS.sortMode
  );
  const [shelfSelection, setShelfSelectionState] = useState<ShelfSelection>({
    included: [...LYRIC_VIEW_DEFAULTS.includedShelves],
    excluded: [...LYRIC_VIEW_DEFAULTS.excludedShelves],
  });
  const includedShelves = shelfSelection.included;
  const excludedShelves = shelfSelection.excluded;
  const [shuffleSeed, setShuffleSeed] = useState(1);
  const [fontSize, setFontSize] = useState(LYRIC_VIEW_DEFAULTS.fontSize);
  const [lineHeight, setLineHeight] = useState(LYRIC_VIEW_DEFAULTS.lineHeight);
  const [lineGap, setLineGap] = useState(LYRIC_VIEW_DEFAULTS.lineGap);
  const [carouselSpeed, setCarouselSpeed] = useState(
    LYRIC_VIEW_DEFAULTS.carouselSpeed
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [keyword, setKeyword] = useState(LYRIC_VIEW_DEFAULTS.keyword);
  const [dateFrom, setDateFrom] = useState(LYRIC_VIEW_DEFAULTS.dateFrom);
  const [dateTo, setDateTo] = useState(LYRIC_VIEW_DEFAULTS.dateTo);
  const [mood, setMood] = useState<LyricMood[]>(LYRIC_VIEW_DEFAULTS.mood);
  const [delivery, setDelivery] = useState<LyricDelivery[]>(
    LYRIC_VIEW_DEFAULTS.delivery
  );
  const [songRole, setSongRole] = useState<LyricSongRole[]>(
    LYRIC_VIEW_DEFAULTS.songRole
  );
  const [readiness, setReadiness] = useState<LyricReadiness | null>(
    LYRIC_VIEW_DEFAULTS.readiness
  );
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    const stored = readPersistedSettings();

    if (stored) {
      setSortModeState(stored.sortMode);
      setFontSize(stored.fontSize);
      setLineHeight(stored.lineHeight);
      setLineGap(stored.lineGap);
      setCarouselSpeed(stored.carouselSpeed);
    }

    setSettingsReady(true);
  }, []);

  useEffect(() => {
    if (!settingsReady) {
      return;
    }

    writePersistedSettings({
      sortMode,
      fontSize,
      lineHeight,
      lineGap,
      carouselSpeed,
    });
  }, [settingsReady, sortMode, fontSize, lineHeight, lineGap, carouselSpeed]);

  const setSortMode = useCallback((mode: SortMode) => {
    setSortModeState(mode);

    if (mode === 'shuffle') {
      setShuffleSeed(nextShuffleSeed);
    }
  }, []);

  const setShelfSelection = useCallback(
    (
      selection: ShelfSelection | ((current: ShelfSelection) => ShelfSelection)
    ) => {
      setShelfSelectionState((current) =>
        typeof selection === 'function' ? selection(current) : selection
      );
    },
    []
  );

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }, []);

  const toggleEmoji = useCallback((emoji: string) => {
    setSelectedEmojis((current) =>
      current.includes(emoji)
        ? current.filter((item) => item !== emoji)
        : [...current, emoji]
    );
  }, []);

  const resetSettings = useCallback(() => {
    setSortModeState(LYRIC_VIEW_DEFAULTS.sortMode);
    setFontSize(LYRIC_VIEW_DEFAULTS.fontSize);
    setLineHeight(LYRIC_VIEW_DEFAULTS.lineHeight);
    setLineGap(LYRIC_VIEW_DEFAULTS.lineGap);
    setCarouselSpeed(LYRIC_VIEW_DEFAULTS.carouselSpeed);
  }, []);

  const resetFilters = useCallback(() => {
    setShelfSelectionState({
      included: [...LYRIC_VIEW_DEFAULTS.includedShelves],
      excluded: [...LYRIC_VIEW_DEFAULTS.excludedShelves],
    });
    setSelectedTags([]);
    setSelectedEmojis([]);
    setKeyword(LYRIC_VIEW_DEFAULTS.keyword);
    setDateFrom(LYRIC_VIEW_DEFAULTS.dateFrom);
    setDateTo(LYRIC_VIEW_DEFAULTS.dateTo);
    setMood(LYRIC_VIEW_DEFAULTS.mood);
    setDelivery(LYRIC_VIEW_DEFAULTS.delivery);
    setSongRole(LYRIC_VIEW_DEFAULTS.songRole);
    setReadiness(LYRIC_VIEW_DEFAULTS.readiness);
  }, []);

  const value = useMemo(
    () => ({
      sortMode,
      shuffleSeed,
      includedShelves,
      excludedShelves,
      fontSize,
      lineHeight,
      lineGap,
      carouselSpeed,
      selectedTags,
      selectedEmojis,
      keyword,
      dateFrom,
      dateTo,
      mood,
      delivery,
      songRole,
      readiness,
      setSortMode,
      setShelfSelection,
      setFontSize,
      setLineHeight,
      setLineGap,
      setCarouselSpeed,
      toggleTag,
      toggleEmoji,
      setKeyword,
      setDateFrom,
      setDateTo,
      setMood,
      setDelivery,
      setSongRole,
      setReadiness,
      resetSettings,
      resetFilters,
    }),
    [
      sortMode,
      shuffleSeed,
      includedShelves,
      excludedShelves,
      fontSize,
      lineHeight,
      lineGap,
      carouselSpeed,
      selectedTags,
      selectedEmojis,
      keyword,
      dateFrom,
      dateTo,
      mood,
      delivery,
      songRole,
      readiness,
      setSortMode,
      setShelfSelection,
      toggleTag,
      toggleEmoji,
      resetSettings,
      resetFilters,
    ]
  );

  return (
    <LyricViewContext.Provider value={value}>
      {children}
    </LyricViewContext.Provider>
  );
}

export function useLyricView() {
  const context = useContext(LyricViewContext);

  if (!context) {
    throw new Error('useLyricView должен вызываться внутри LyricViewProvider');
  }

  return context;
}

export function slideTiming(
  carouselSpeed: number,
  lineGap = LYRIC_VIEW_DEFAULTS.lineGap,
  fontSize = LYRIC_VIEW_DEFAULTS.fontSize
) {
  const speed = Math.min(10, Math.max(1, carouselSpeed));
  const spacing =
    (Math.min(10, Math.max(1, lineGap)) / LYRIC_VIEW_DEFAULTS.lineGap) *
    (Math.min(36, Math.max(16, fontSize)) / LYRIC_VIEW_DEFAULTS.fontSize);
  const slideIntervalMs = ((2000 * 5) / speed) * spacing;
  const animationMs = (12000 * 5) / speed;

  return { slideIntervalMs, animationMs };
}

export function hasCustomLyricSettings(options: {
  sortMode: SortMode;
  fontSize: number;
  lineHeight: number;
  lineGap: number;
  carouselSpeed: number;
}): boolean {
  return (
    options.sortMode !== LYRIC_VIEW_DEFAULTS.sortMode ||
    options.fontSize !== LYRIC_VIEW_DEFAULTS.fontSize ||
    options.lineHeight !== LYRIC_VIEW_DEFAULTS.lineHeight ||
    options.lineGap !== LYRIC_VIEW_DEFAULTS.lineGap ||
    options.carouselSpeed !== LYRIC_VIEW_DEFAULTS.carouselSpeed
  );
}

export function hasActiveLyricFilters(options: {
  includedShelves: ShelfFlag[];
  excludedShelves: ShelfFlag[];
  selectedTags: string[];
  selectedEmojis: string[];
  keyword: string;
  dateFrom: string;
  dateTo: string;
  mood: LyricMood[];
  delivery: LyricDelivery[];
  songRole: LyricSongRole[];
  readiness: LyricReadiness | null;
}): boolean {
  return (
    !isDefaultShelfSelection({
      included: options.includedShelves,
      excluded: options.excludedShelves,
    }) ||
    options.selectedTags.length > 0 ||
    options.selectedEmojis.length > 0 ||
    options.keyword.trim().length > 0 ||
    options.dateFrom.trim().length > 0 ||
    options.dateTo.trim().length > 0 ||
    options.mood.length > 0 ||
    options.delivery.length > 0 ||
    options.songRole.length > 0 ||
    options.readiness !== null
  );
}
