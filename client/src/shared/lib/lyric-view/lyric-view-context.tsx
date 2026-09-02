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

export const SORT_MODES = ['shuffle', 'forward', 'reverse'] as const;

export type SortMode = (typeof SORT_MODES)[number];

export const SHELF_MODES = [
  'all',
  'favorites',
  'hidden',
  'references',
] as const;

export type ShelfMode = (typeof SHELF_MODES)[number];

export const LYRIC_VIEW_DEFAULTS = {
  sortMode: 'shuffle' as SortMode,
  shelfMode: 'all' as ShelfMode,
  fontSize: 31,
  lineHeight: 1.45,
  lineGap: 2,
  carouselSpeed: 3,
  keyword: '',
  dateFrom: '',
  dateTo: '',
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
      lineGap: clamp(Math.round(record.lineGap), 1, 10),
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
  shelfMode: ShelfMode;
  fontSize: number;
  lineHeight: number;
  lineGap: number;
  carouselSpeed: number;
  selectedTags: string[];
  selectedEmojis: string[];
  keyword: string;
  dateFrom: string;
  dateTo: string;
  setSortMode: (mode: SortMode) => void;
  setShelfMode: (mode: ShelfMode) => void;
  setFontSize: (value: number) => void;
  setLineHeight: (value: number) => void;
  setLineGap: (value: number) => void;
  setCarouselSpeed: (value: number) => void;
  toggleTag: (tag: string) => void;
  toggleEmoji: (emoji: string) => void;
  setKeyword: (value: string) => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  resetSettings: () => void;
  resetFilters: () => void;
}

const LyricViewContext = createContext<LyricViewContextValue | null>(null);

export function LyricViewProvider({ children }: { children: ReactNode }) {
  const [sortMode, setSortModeState] = useState<SortMode>(
    LYRIC_VIEW_DEFAULTS.sortMode
  );
  const [shelfMode, setShelfModeState] = useState<ShelfMode>(
    LYRIC_VIEW_DEFAULTS.shelfMode
  );
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
      setShuffleSeed(Date.now());
    }
  }, []);

  const setShelfMode = useCallback((mode: ShelfMode) => {
    setShelfModeState(mode);
  }, []);

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
    setShelfModeState(LYRIC_VIEW_DEFAULTS.shelfMode);
    setSelectedTags([]);
    setSelectedEmojis([]);
    setKeyword(LYRIC_VIEW_DEFAULTS.keyword);
    setDateFrom(LYRIC_VIEW_DEFAULTS.dateFrom);
    setDateTo(LYRIC_VIEW_DEFAULTS.dateTo);
  }, []);

  const value = useMemo(
    () => ({
      sortMode,
      shuffleSeed,
      shelfMode,
      fontSize,
      lineHeight,
      lineGap,
      carouselSpeed,
      selectedTags,
      selectedEmojis,
      keyword,
      dateFrom,
      dateTo,
      setSortMode,
      setShelfMode,
      setFontSize,
      setLineHeight,
      setLineGap,
      setCarouselSpeed,
      toggleTag,
      toggleEmoji,
      setKeyword,
      setDateFrom,
      setDateTo,
      resetSettings,
      resetFilters,
    }),
    [
      sortMode,
      shuffleSeed,
      shelfMode,
      fontSize,
      lineHeight,
      lineGap,
      carouselSpeed,
      selectedTags,
      selectedEmojis,
      keyword,
      dateFrom,
      dateTo,
      setSortMode,
      setShelfMode,
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
  shelfMode: ShelfMode;
  selectedTags: string[];
  selectedEmojis: string[];
  keyword: string;
  dateFrom: string;
  dateTo: string;
}): boolean {
  return (
    options.shelfMode !== LYRIC_VIEW_DEFAULTS.shelfMode ||
    options.selectedTags.length > 0 ||
    options.selectedEmojis.length > 0 ||
    options.keyword.trim().length > 0 ||
    options.dateFrom.trim().length > 0 ||
    options.dateTo.trim().length > 0
  );
}
