'use client';

import { type ReactNode, useEffect } from 'react';

import { usePlayback } from '@/shared/lib/playback/playback-context';
import { PauseAtmosphere } from '@/shared/ui/pause-atmosphere';

function isSpaceReservedTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(
    target.closest(
      'button, [role="button"], input, textarea, select, [contenteditable="true"]'
    )
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { paused, canPlay, overlayOpen, togglePause } = usePlayback();
  const atmosphereActive = paused || !canPlay || overlayOpen;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') {
        return;
      }

      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (isSpaceReservedTarget(event.target)) {
        return;
      }

      event.preventDefault();
      togglePause();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePause]);

  return (
    <div
      className="lyric-app bg-background text-foreground flex h-svh items-center justify-center overflow-hidden"
      data-paused={atmosphereActive}
    >
      <PauseAtmosphere active={atmosphereActive} />
      <div
        className="relative flex h-full min-h-0 w-full max-w-[640px] cursor-pointer flex-col items-center overflow-hidden"
        onClick={togglePause}
      >
        {children}
      </div>
    </div>
  );
}
