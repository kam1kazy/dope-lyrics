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

interface CarouselSessionValue {
  mode: CarouselSessionMode;
  queue: ILyric[];
  prepend: ILyric | null;
  sessionKey: number;
  addToQueue: (lyric: ILyric) => void;
  removeFromQueue: (lyricId: number) => void;
  playNow: (lyric: ILyric) => void;
  loadQueue: (lyrics: ILyric[]) => void;
  clearQueue: () => void;
  resetToCatalog: () => void;
}

const CarouselSessionContext = createContext<CarouselSessionValue | null>(null);

export function CarouselSessionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CarouselSessionMode>('catalog');
  const [queue, setQueue] = useState<ILyric[]>([]);
  const [prepend, setPrepend] = useState<ILyric | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

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

  const value = useMemo(
    () => ({
      mode,
      queue,
      prepend,
      sessionKey,
      addToQueue,
      removeFromQueue,
      playNow,
      loadQueue,
      clearQueue,
      resetToCatalog,
    }),
    [
      addToQueue,
      clearQueue,
      mode,
      playNow,
      loadQueue,
      prepend,
      queue,
      removeFromQueue,
      resetToCatalog,
      sessionKey,
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
