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
  carouselSpeed: 5,
  keyword: '',
};

interface LyricViewContextValue {
  sortMode: SortMode;
  shuffleSeed: number;
  fontSize: number;
  lineHeight: number;
  carouselSpeed: number;
  selectedTags: string[];
  keyword: string;
  setSortMode: (mode: SortMode) => void;
  setFontSize: (value: number) => void;
  setLineHeight: (value: number) => void;
  setCarouselSpeed: (value: number) => void;
  toggleTag: (tag: string) => void;
  setKeyword: (value: string) => void;
}

const LyricViewContext = createContext<LyricViewContextValue | null>(null);

export function LyricViewProvider({ children }: { children: ReactNode }) {
  const [sortMode, setSortModeState] = useState<SortMode>(
    LYRIC_VIEW_DEFAULTS.sortMode
  );
  const [shuffleSeed, setShuffleSeed] = useState(1);
  const [fontSize, setFontSize] = useState(LYRIC_VIEW_DEFAULTS.fontSize);
  const [lineHeight, setLineHeight] = useState(LYRIC_VIEW_DEFAULTS.lineHeight);
  const [carouselSpeed, setCarouselSpeed] = useState(
    LYRIC_VIEW_DEFAULTS.carouselSpeed
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [keyword, setKeyword] = useState(LYRIC_VIEW_DEFAULTS.keyword);

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

  const value = useMemo(
    () => ({
      sortMode,
      shuffleSeed,
      fontSize,
      lineHeight,
      carouselSpeed,
      selectedTags,
      keyword,
      setSortMode,
      setFontSize,
      setLineHeight,
      setCarouselSpeed,
      toggleTag,
      setKeyword,
    }),
    [
      sortMode,
      shuffleSeed,
      fontSize,
      lineHeight,
      carouselSpeed,
      selectedTags,
      keyword,
      setSortMode,
      toggleTag,
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

export function slideTiming(carouselSpeed: number) {
  const speed = Math.min(10, Math.max(1, carouselSpeed));
  const slideIntervalMs = (2000 * 5) / speed;
  const animationMs = (12000 * 5) / speed;

  return { slideIntervalMs, animationMs };
}
