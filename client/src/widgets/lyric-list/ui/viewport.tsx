'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { LyricItem, type LyricSlide } from '@/entities/lyric';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { cn } from '@/shared/lib/utils/cn';

interface ViewportProps {
  data: LyricSlide[];
}

const SLIDE_INTERVAL_MS = 2000;
const ANIMATION_MS = 12000;
const START_Y_VH = 52;
const END_Y_VH = -58;
const FADE_IN = 0.08;
const FADE_OUT = 0.12;

function slideOpacity(progress: number) {
  if (progress < FADE_IN) {
    return progress / FADE_IN;
  }

  if (progress > 1 - FADE_OUT) {
    return (1 - progress) / FADE_OUT;
  }

  return 1;
}

function elapsedSinceStart(
  originMs: number,
  pausedAccumMs: number,
  pauseStartedAt: number | null
) {
  const extraPause = pauseStartedAt === null ? 0 : Date.now() - pauseStartedAt;

  return Math.max(0, Date.now() - originMs - pausedAccumMs - extraPause);
}

function applyPositions(
  nodes: Map<number, HTMLDivElement>,
  elapsedMs: number,
  dataLength: number
) {
  const maxIndex = Math.max(dataLength - 1, 0);
  const activeIndex = Math.min(
    Math.floor(elapsedMs / SLIDE_INTERVAL_MS),
    maxIndex
  );

  for (const [index, node] of nodes) {
    const age = elapsedMs - index * SLIDE_INTERVAL_MS;

    if (age < 0 || age > ANIMATION_MS) {
      node.style.opacity = '0';
      node.style.visibility = 'hidden';
      continue;
    }

    const progress = age / ANIMATION_MS;
    const y = START_Y_VH + (END_Y_VH - START_Y_VH) * progress;

    node.style.visibility = 'visible';
    node.style.opacity = String(slideOpacity(progress));
    node.style.transform = `translate3d(0, ${y}vh, 0)`;
  }

  return activeIndex;
}

export function Viewport({ data }: ViewportProps) {
  const { paused } = usePlayback();
  const originRef = useRef(Date.now());
  const pausedAccumRef = useRef(0);
  const pauseStartedRef = useRef<number | null>(null);
  const nodesRef = useRef(new Map<number, HTMLDivElement>());
  const [lastIndex, setLastIndex] = useState(0);
  const dataLength = data.length;

  useLayoutEffect(() => {
    applyPositions(
      nodesRef.current,
      elapsedSinceStart(
        originRef.current,
        pausedAccumRef.current,
        pauseStartedRef.current
      ),
      dataLength
    );
  }, [dataLength, lastIndex]);

  useEffect(() => {
    const currentPositions = () =>
      applyPositions(
        nodesRef.current,
        elapsedSinceStart(
          originRef.current,
          pausedAccumRef.current,
          pauseStartedRef.current
        ),
        dataLength
      );

    if (paused) {
      if (pauseStartedRef.current === null) {
        pauseStartedRef.current = Date.now();
      }

      setLastIndex(currentPositions());
      return;
    }

    if (pauseStartedRef.current !== null) {
      pausedAccumRef.current += Date.now() - pauseStartedRef.current;
      pauseStartedRef.current = null;
    }

    let frame = 0;

    const tick = () => {
      const nextIndex = currentPositions();

      setLastIndex((current) => (current === nextIndex ? current : nextIndex));
      frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      setLastIndex(currentPositions());
    };

    frame = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('pageshow', sync);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('pageshow', sync);
    };
  }, [dataLength, paused]);

  const firstVisible = Math.max(
    0,
    lastIndex - Math.ceil(ANIMATION_MS / SLIDE_INTERVAL_MS)
  );
  const visibleSlides = data.slice(firstVisible, lastIndex + 1);

  return (
    <div
      className="lyric-viewport relative min-h-0 w-full flex-1 overflow-hidden"
      data-paused={paused}
    >
      {visibleSlides.map((item, offset) => {
        const index = firstVisible + offset;

        return (
          <div
            key={`${item.lyric_id}_${item.message?.message_id}_${index}`}
            className="lyric"
            ref={(node) => {
              if (node) {
                nodesRef.current.set(index, node);
              } else {
                nodesRef.current.delete(index);
              }
            }}
          >
            <LyricItem item={item} />
          </div>
        );
      })}

      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-background to-transparent transition-all duration-300',
          paused ? 'h-36 opacity-100' : 'h-10 opacity-50'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background to-transparent transition-all duration-300',
          paused ? 'h-36 opacity-100' : 'h-10 opacity-50'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 z-10 bg-gradient-to-r from-background to-transparent transition-all duration-300',
          paused ? 'w-16 opacity-100' : 'w-6 opacity-40'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 z-10 bg-gradient-to-l from-background to-transparent transition-all duration-300',
          paused ? 'w-16 opacity-100' : 'w-6 opacity-40'
        )}
      />
    </div>
  );
}
