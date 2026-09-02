'use client';

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { LyricItem, type LyricSlide } from '@/entities/lyric';
import {
  slideTiming,
  useLyricView,
} from '@/shared/lib/lyric-view/lyric-view-context';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { Button } from '@/shared/ui/shadcn/ui/button';

interface ViewportProps {
  data: LyricSlide[];
}

const START_Y_VH = 52;
const END_Y_VH = -58;
const FADE_IN = 0.08;
const FADE_OUT = 0.12;
const SCRUB_PX = 8;

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

function runEndedAt(
  dataLength: number,
  slideIntervalMs: number,
  animationMs: number
) {
  return Math.max(0, dataLength - 1) * slideIntervalMs + animationMs;
}

function applyPositions(
  nodes: Map<number, HTMLDivElement>,
  elapsedMs: number,
  dataLength: number,
  slideIntervalMs: number,
  animationMs: number
) {
  const maxIndex = Math.max(dataLength - 1, 0);
  const activeIndex = Math.min(
    Math.floor(elapsedMs / slideIntervalMs),
    maxIndex
  );

  for (const [index, node] of nodes) {
    const age = elapsedMs - index * slideIntervalMs;

    if (age < 0 || age > animationMs) {
      node.style.opacity = '0';
      node.style.visibility = 'hidden';
      continue;
    }

    const progress = age / animationMs;
    const y = START_Y_VH + (END_Y_VH - START_Y_VH) * progress;

    node.style.visibility = 'visible';
    node.style.opacity = String(slideOpacity(progress));
    node.style.transform = `translate3d(0, ${y}vh, 0)`;
  }

  return activeIndex;
}

export function Viewport({ data }: ViewportProps) {
  const { paused, setPaused, suppressToggle } = usePlayback();
  const { carouselSpeed, lineGap, fontSize } = useLyricView();
  const { slideIntervalMs, animationMs } = slideTiming(
    carouselSpeed,
    lineGap,
    fontSize
  );
  const originRef = useRef(Date.now());
  const pausedAccumRef = useRef(0);
  const pauseStartedRef = useRef<number | null>(null);
  const intervalRef = useRef(slideIntervalMs);
  const nodesRef = useRef(new Map<number, HTMLDivElement>());
  const scrubbingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const pointerYRef = useRef(0);
  const pointerStartYRef = useRef(0);
  const timingRef = useRef({ slideIntervalMs, animationMs, dataLength: 0 });
  const [lastIndex, setLastIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const dataLength = data.length;
  timingRef.current = { slideIntervalMs, animationMs, dataLength };

  const currentElapsed = () =>
    elapsedSinceStart(
      originRef.current,
      pausedAccumRef.current,
      pauseStartedRef.current
    );

  const writeElapsed = useCallback((nextMs: number) => {
    const extraPause =
      pauseStartedRef.current === null
        ? 0
        : Date.now() - pauseStartedRef.current;

    originRef.current =
      Date.now() - pausedAccumRef.current - extraPause - nextMs;
  }, []);

  const currentPositions = useCallback(() => {
    return applyPositions(
      nodesRef.current,
      currentElapsed(),
      dataLength,
      slideIntervalMs,
      animationMs
    );
  }, [animationMs, dataLength, slideIntervalMs]);

  const restart = useCallback(() => {
    originRef.current = Date.now();
    pausedAccumRef.current = 0;
    pauseStartedRef.current = null;
    scrubbingRef.current = false;
    setFinished(false);
    setLastIndex(0);
    setPaused(false);
  }, [setPaused]);

  const seekByDeltaY = useCallback(
    (deltaY: number) => {
      const { animationMs: timingAnimation, slideIntervalMs: timingInterval } =
        timingRef.current;
      const spanVh = END_Y_VH - START_Y_VH;
      const deltaMs =
        ((deltaY / window.innerHeight) * 100 * timingAnimation) / spanVh;
      const endedAt = runEndedAt(dataLength, timingInterval, timingAnimation);
      const next = Math.min(endedAt, Math.max(0, currentElapsed() + deltaMs));

      writeElapsed(next);
      setLastIndex(currentPositions());
      setFinished(next >= endedAt && dataLength > 0);
    },
    [currentPositions, dataLength, writeElapsed]
  );

  useLayoutEffect(() => {
    const previousInterval = intervalRef.current;

    if (previousInterval !== slideIntervalMs && previousInterval > 0) {
      const extraPause =
        pauseStartedRef.current === null
          ? 0
          : Date.now() - pauseStartedRef.current;
      const elapsed = elapsedSinceStart(
        originRef.current,
        pausedAccumRef.current,
        pauseStartedRef.current
      );
      const nextElapsed = (elapsed / previousInterval) * slideIntervalMs;

      originRef.current =
        Date.now() - pausedAccumRef.current - extraPause - nextElapsed;
    }

    intervalRef.current = slideIntervalMs;
  }, [slideIntervalMs]);

  useLayoutEffect(() => {
    if (finished && !scrubbingRef.current) {
      return;
    }

    currentPositions();
  }, [currentPositions, finished, lastIndex]);

  useEffect(() => {
    if (finished || scrubbingRef.current) {
      return;
    }

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
      if (scrubbingRef.current) {
        return;
      }

      const elapsed = currentElapsed();

      if (elapsed >= runEndedAt(dataLength, slideIntervalMs, animationMs)) {
        currentPositions();
        setFinished(true);
        return;
      }

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
  }, [
    animationMs,
    currentPositions,
    dataLength,
    finished,
    paused,
    slideIntervalMs,
  ]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target instanceof HTMLElement && event.target.closest('button')) {
      return;
    }

    pointerYRef.current = event.clientY;
    pointerStartYRef.current = event.clientY;
    wasPlayingRef.current = !paused;
    scrubbingRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    const deltaY = event.clientY - pointerYRef.current;
    pointerYRef.current = event.clientY;

    if (!scrubbingRef.current) {
      if (Math.abs(event.clientY - pointerStartYRef.current) < SCRUB_PX) {
        return;
      }

      scrubbingRef.current = true;
      suppressToggle();

      if (wasPlayingRef.current) {
        setPaused(true);
      }

      seekByDeltaY(event.clientY - pointerStartYRef.current);
      return;
    }

    seekByDeltaY(deltaY);
  };

  const endScrub = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!scrubbingRef.current) {
      return;
    }

    scrubbingRef.current = false;
    suppressToggle();

    if (wasPlayingRef.current) {
      setPaused(false);
    }
  };

  const firstVisible = Math.max(
    0,
    lastIndex - Math.ceil(animationMs / slideIntervalMs)
  );
  const visibleSlides = finished ? [] : data.slice(firstVisible, lastIndex + 1);

  return (
    <div
      className="lyric-viewport relative min-h-0 w-full flex-1 touch-none overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endScrub}
      onPointerCancel={endScrub}
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

      {finished ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <Button
            type="button"
            size="lg"
            className="pointer-events-auto"
            onClick={(event) => {
              event.stopPropagation();
              restart();
            }}
          >
            Повторить
          </Button>
        </div>
      ) : null}
    </div>
  );
}
