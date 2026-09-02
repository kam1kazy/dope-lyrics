'use client';

import type { ReactNode } from 'react';

import { usePlayback } from '@/shared/lib/playback/playback-context';

export function AppShell({ children }: { children: ReactNode }) {
  const { togglePause } = usePlayback();

  return (
    <div className="bg-background text-foreground flex h-svh items-center justify-center overflow-hidden">
      <div
        className="relative flex h-full min-h-0 w-full max-w-[640px] cursor-pointer flex-col items-center overflow-hidden"
        onClick={togglePause}
      >
        {children}
      </div>
    </div>
  );
}
