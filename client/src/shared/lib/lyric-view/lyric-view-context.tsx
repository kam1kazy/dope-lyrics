'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export const SORT_MODES = ['shuffle', 'forward', 'reverse'] as const;

export type SortMode = (typeof SORT_MODES)[number];

export const LYRIC_VIEW_DEFAULTS = {
  sortMode: 'forward' as SortMode,
  fontSize: 24,
  lineHeight: 1.35,
  lineGap: 5,
  carouselSpeed: 5,
  keyword: '',
  dateFrom: '',
  dateTo: '',
};

interface LyricViewContextValue {
  sortMode: SortMode;
  shuffleSeed: number;
  fontSize: number;
  lineHeight: number;
  lineGap: number;
  carouselSpeed: number;
  selectedTags: string[];
  selectedEmojis: string[];
  keyword: string;
  dateFrom: string;
  dateTo: string;
  referencesOnly: boolean;
  setSortMode: (mode: SortMode) => void;
  setFontSize: (value: number) => void;
  setLineHeight: (value: number) => void;
  setLineGap: (value: number) => void;
  setCarouselSpeed: (value: number) => void;
  toggleTag: (tag: string) => void;
  toggleEmoji: (emoji: string) => void;
  setKeyword: (value: string) => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  setReferencesOnly: (value: boolean) => void;
  resetSettings: () => void;
  resetFilters: () => void;
}

const LyricViewContext = createContext<LyricViewContextValue | null>(null);

export function LyricViewProvider({ children }: { children: ReactNode }) {
  const [sortMode, setSortModeState] = useState<SortMode>(
    LYRIC_VIEW_DEFAULTS.sortMode
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
  const [referencesOnly, setReferencesOnly] = useState(false);

  const setSortMode = useCallback((mode: SortMode) => {
    setSortModeState(mode);

    if (mode === 'shuffle') {
      setShuffleSeed(Date.now());
    }
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
    setSelectedTags([]);
    setSelectedEmojis([]);
    setKeyword(LYRIC_VIEW_DEFAULTS.keyword);
    setDateFrom(LYRIC_VIEW_DEFAULTS.dateFrom);
    setDateTo(LYRIC_VIEW_DEFAULTS.dateTo);
    setReferencesOnly(false);
  }, []);

  const value = useMemo(
    () => ({
      sortMode,
      shuffleSeed,
      fontSize,
      lineHeight,
      lineGap,
      carouselSpeed,
      selectedTags,
      selectedEmojis,
      keyword,
      dateFrom,
      dateTo,
      referencesOnly,
      setSortMode,
      setFontSize,
      setLineHeight,
      setLineGap,
      setCarouselSpeed,
      toggleTag,
      toggleEmoji,
      setKeyword,
      setDateFrom,
      setDateTo,
      setReferencesOnly,
      resetSettings,
      resetFilters,
    }),
    [
      sortMode,
      shuffleSeed,
      fontSize,
      lineHeight,
      lineGap,
      carouselSpeed,
      selectedTags,
      selectedEmojis,
      keyword,
      dateFrom,
      dateTo,
      referencesOnly,
      setSortMode,
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
  selectedTags: string[];
  selectedEmojis: string[];
  keyword: string;
  dateFrom: string;
  dateTo: string;
  referencesOnly: boolean;
}): boolean {
  return (
    options.selectedTags.length > 0 ||
    options.selectedEmojis.length > 0 ||
    options.keyword.trim().length > 0 ||
    options.dateFrom.trim().length > 0 ||
    options.dateTo.trim().length > 0 ||
    options.referencesOnly
  );
}
