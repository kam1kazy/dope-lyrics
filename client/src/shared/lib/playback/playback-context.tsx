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
  togglePause: () => void;
  setPaused: (value: boolean) => void;
  suppressToggle: () => void;
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null);
const TOGGLE_SUPPRESS_MS = 400;

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [paused, setPausedState] = useState(false);
  const suppressUntilRef = useRef(0);

  const suppressToggle = useCallback(() => {
    suppressUntilRef.current = Date.now() + TOGGLE_SUPPRESS_MS;
  }, []);

  const setPaused = useCallback((value: boolean) => {
    setPausedState(value);
  }, []);

  const togglePause = useCallback(() => {
    if (Date.now() < suppressUntilRef.current) {
      return;
    }

    setPausedState((current) => !current);
  }, []);

  const value = useMemo(
    () => ({ paused, togglePause, setPaused, suppressToggle }),
    [paused, setPaused, suppressToggle, togglePause]
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
