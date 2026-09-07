'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { ILyric } from '@/entities/lyric';

export type CarouselSessionMode = 'catalog' | 'queue';

export type LikedLine = {
  key: string;
  lyricId: number;
  lineIndex: number;
  text: string;
};

export function likedLineKey(lyricId: number, lineIndex: number) {
  return `${lyricId}:${lineIndex}`;
}

interface CarouselSessionValue {
  mode: CarouselSessionMode;
  queue: ILyric[];
  prepend: ILyric | null;
  sessionKey: number;
  likedLines: LikedLine[];
  likedLyricIds: number[];
  addToQueue: (lyric: ILyric) => void;
  removeFromQueue: (lyricId: number) => void;
  playNow: (lyric: ILyric) => void;
  loadQueue: (lyrics: ILyric[]) => void;
  clearQueue: () => void;
  resetToCatalog: () => void;
  toggleLike: (input: {
    lyricId: number;
    lineIndex: number;
    text?: string;
  }) => boolean;
  removeLike: (key: string) => void;
  clearLikes: () => void;
  isLineLiked: (lyricId: number, lineIndex: number) => boolean;
}

const CarouselSessionContext = createContext<CarouselSessionValue | null>(null);

function lineText(text: string | null | undefined) {
  const trimmed = (text ?? '').trim();
  return trimmed || 'Без текста';
}

function uniqueLyricIds(lines: LikedLine[]) {
  const seen = new Set<number>();
  const ids: number[] = [];

  for (const line of lines) {
    if (seen.has(line.lyricId)) {
      continue;
    }

    seen.add(line.lyricId);
    ids.push(line.lyricId);
  }

  return ids;
}

export function CarouselSessionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CarouselSessionMode>('catalog');
  const [queue, setQueue] = useState<ILyric[]>([]);
  const [prepend, setPrepend] = useState<ILyric | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [likedLines, setLikedLines] = useState<LikedLine[]>([]);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const likedLinesRef = useRef(likedLines);
  likedLinesRef.current = likedLines;

  const bumpSession = useCallback(() => {
    setSessionKey((current) => current + 1);
  }, []);

  const addToQueue = useCallback(
    (lyric: ILyric) => {
      setMode('queue');
      setPrepend(null);
      setQueue((current) => [...current, lyric]);
      bumpSession();
    },
    [bumpSession]
  );

  const removeFromQueue = useCallback(
    (lyricId: number) => {
      setQueue((current) => current.filter((item) => item.id !== lyricId));
      bumpSession();
    },
    [bumpSession]
  );

  const playNow = useCallback(
    (lyric: ILyric) => {
      if (modeRef.current === 'queue') {
        setQueue((current) => [
          lyric,
          ...current.filter((item) => item.id !== lyric.id),
        ]);
        setPrepend(null);
      } else {
        setPrepend(lyric);
      }

      bumpSession();
    },
    [bumpSession]
  );

  const loadQueue = useCallback(
    (lyrics: ILyric[]) => {
      setMode('queue');
      setQueue(lyrics);
      setPrepend(null);
      bumpSession();
    },
    [bumpSession]
  );

  const clearQueue = useCallback(() => {
    setMode('queue');
    setQueue([]);
    setPrepend(null);
    bumpSession();
  }, [bumpSession]);

  const resetToCatalog = useCallback(() => {
    setMode('catalog');
    setQueue([]);
    setPrepend(null);
    bumpSession();
  }, [bumpSession]);

  const toggleLike = useCallback(
    (input: { lyricId: number; lineIndex: number; text?: string }) => {
      if (input.lyricId < 1 || input.lineIndex < 0) {
        return false;
      }

      const key = likedLineKey(input.lyricId, input.lineIndex);
      const already = likedLinesRef.current.some((line) => line.key === key);

      if (already) {
        setLikedLines((current) => current.filter((line) => line.key !== key));
        return false;
      }

      setLikedLines((current) => [
        ...current,
        {
          key,
          lyricId: input.lyricId,
          lineIndex: input.lineIndex,
          text: lineText(input.text),
        },
      ]);
      return true;
    },
    []
  );

  const removeLike = useCallback((key: string) => {
    setLikedLines((current) => current.filter((line) => line.key !== key));
  }, []);

  const clearLikes = useCallback(() => {
    setLikedLines([]);
  }, []);

  const isLineLiked = useCallback((lyricId: number, lineIndex: number) => {
    const key = likedLineKey(lyricId, lineIndex);
    return likedLinesRef.current.some((line) => line.key === key);
  }, []);

  const likedLyricIds = useMemo(() => uniqueLyricIds(likedLines), [likedLines]);

  const value = useMemo(
    () => ({
      mode,
      queue,
      prepend,
      sessionKey,
      likedLines,
      likedLyricIds,
      addToQueue,
      removeFromQueue,
      playNow,
      loadQueue,
      clearQueue,
      resetToCatalog,
      toggleLike,
      removeLike,
      clearLikes,
      isLineLiked,
    }),
    [
      addToQueue,
      clearLikes,
      clearQueue,
      isLineLiked,
      likedLines,
      likedLyricIds,
      loadQueue,
      mode,
      playNow,
      prepend,
      queue,
      removeFromQueue,
      removeLike,
      resetToCatalog,
      sessionKey,
      toggleLike,
    ]
  );

  return (
    <CarouselSessionContext.Provider value={value}>
      {children}
    </CarouselSessionContext.Provider>
  );
}

export function useCarouselSession() {
  const value = useContext(CarouselSessionContext);

  if (!value) {
    throw new Error('useCarouselSession вне CarouselSessionProvider');
  }

  return value;
}
