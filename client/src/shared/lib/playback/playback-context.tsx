'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface PlaybackContextValue {
  paused: boolean;
  togglePause: () => void;
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);

  const togglePause = useCallback(() => {
    setPaused((current) => !current);
  }, []);

  const value = useMemo(() => ({ paused, togglePause }), [paused, togglePause]);

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
