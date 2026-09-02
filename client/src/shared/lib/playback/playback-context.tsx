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

interface PlaybackContextValue {
  paused: boolean;
  canPlay: boolean;
  overlayOpen: boolean;
  togglePause: () => void;
  setPaused: (value: boolean) => void;
  setCanPlay: (value: boolean) => void;
  suppressToggle: () => void;
  beginOverlay: () => void;
  endOverlay: () => void;
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null);
const TOGGLE_SUPPRESS_MS = 400;

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [paused, setPausedState] = useState(false);
  const [canPlay, setCanPlayState] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const suppressUntilRef = useRef(0);
  const overlayCountRef = useRef(0);

  const suppressToggle = useCallback(() => {
    suppressUntilRef.current = Date.now() + TOGGLE_SUPPRESS_MS;
  }, []);

  const setPaused = useCallback((value: boolean) => {
    setPausedState(value);
  }, []);

  const setCanPlay = useCallback((value: boolean) => {
    setCanPlayState(value);
  }, []);

  const beginOverlay = useCallback(() => {
    overlayCountRef.current += 1;
    setOverlayOpen(true);
    setPausedState(true);
  }, []);

  const endOverlay = useCallback(() => {
    overlayCountRef.current = Math.max(0, overlayCountRef.current - 1);
    setOverlayOpen(overlayCountRef.current > 0);
  }, []);

  const togglePause = useCallback(() => {
    if (Date.now() < suppressUntilRef.current) {
      return;
    }

    if (!canPlay || overlayCountRef.current > 0) {
      return;
    }

    setPausedState((current) => !current);
  }, [canPlay]);

  const value = useMemo(
    () => ({
      paused,
      canPlay,
      overlayOpen,
      togglePause,
      setPaused,
      setCanPlay,
      suppressToggle,
      beginOverlay,
      endOverlay,
    }),
    [
      beginOverlay,
      canPlay,
      endOverlay,
      overlayOpen,
      paused,
      setCanPlay,
      setPaused,
      suppressToggle,
      togglePause,
    ]
  );

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const context = useContext(PlaybackContext);

  if (!context) {
    throw new Error('usePlayback должен вызываться внутри PlaybackProvider');
  }

  return context;
}
