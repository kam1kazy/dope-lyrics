'use client';

import type { ReactNode } from 'react';

import { usePlayback } from '@/shared/lib/playback/playback-context';
import { PauseAtmosphere } from '@/shared/ui/pause-atmosphere';

export function AppShell({ children }: { children: ReactNode }) {
  const { paused, togglePause } = usePlayback();

  return (
    <div
      className="lyric-app bg-background text-foreground flex h-svh items-center justify-center overflow-hidden"
      data-paused={paused}
    >
      <PauseAtmosphere active={paused} />
      <div
        className="relative flex h-full min-h-0 w-full max-w-[640px] cursor-pointer flex-col items-center overflow-hidden"
        onClick={togglePause}
      >
        {children}
      </div>
    </div>
  );
}
