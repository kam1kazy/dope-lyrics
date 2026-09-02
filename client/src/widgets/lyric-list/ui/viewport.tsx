'use client';

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  type ILyric,
  LyricItem,
  type LyricSlide,
  type LyricsQueryVariables,
} from '@/entities/lyric';
import { MessageDeskDialog } from '@/features/message-desk';
import {
  slideTiming,
  useLyricView,
} from '@/shared/lib/lyric-view/lyric-view-context';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { Button } from '@/shared/ui/shadcn/ui/button';

interface ViewportProps {
  data: LyricSlide[];
  lyrics: ILyric[];
  queryVariables: LyricsQueryVariables;
}

const START_Y_VH = 52;
const END_Y_VH = -58;
const FADE_IN = 0.08;
const FADE_OUT = 0.12;
const READABLE_PROGRESS = 0.42;
const SCRUB_PX = 20;
const SCRUB_HOLD_MS = 200;
const SCRUB_CLICK_SLIP_PX = 64;
const DOUBLE_TAP_MS = 400;
const DOUBLE_TAP_PX = 48;

function eventElement(event: ReactPointerEvent<HTMLDivElement>) {
  const target = event.target;

  if (target instanceof Element) {
    return target;
  }

  if (target instanceof Node) {
    return target.parentElement;
  }

  return null;
}

function catalogIdFromEvent(event: ReactPointerEvent<HTMLDivElement>) {
  const node = eventElement(event)?.closest('[data-catalog-id]');
  const raw = node?.getAttribute('data-catalog-id');

  if (!raw) {
    return null;
  }

  const id = Number(raw);

  return Number.isFinite(id) ? id : null;
}

function isNearLastTap(
  lastTap: { t: number; x: number; y: number },
  x: number,
  y: number
) {
  const dx = x - lastTap.x;
  const dy = y - lastTap.y;

  return (
    Date.now() - lastTap.t <= DOUBLE_TAP_MS &&
    dx * dx + dy * dy <= DOUBLE_TAP_PX * DOUBLE_TAP_PX
  );
}

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

function hasReadableSlide(
  elapsedMs: number,
  dataLength: number,
  slideIntervalMs: number,
  animationMs: number
) {
  if (dataLength === 0 || slideIntervalMs <= 0 || animationMs <= 0) {
    return false;
  }

  const maxIndex = Math.max(dataLength - 1, 0);
  const activeIndex = Math.min(
    Math.floor(elapsedMs / slideIntervalMs),
    maxIndex
  );
  const firstVisible = Math.max(
    0,
    activeIndex - Math.ceil(animationMs / slideIntervalMs)
  );

  for (let index = firstVisible; index <= activeIndex; index += 1) {
    const age = elapsedMs - index * slideIntervalMs;

    if (age < 0 || age > animationMs) {
      continue;
    }

    const progress = age / animationMs;

    if (progress >= FADE_IN && progress <= 1 - FADE_OUT) {
      return true;
    }
  }

  return false;
}

export function Viewport({ data, lyrics, queryVariables }: ViewportProps) {
  const { paused, canPlay, setPaused, setCanPlay, suppressToggle } =
    usePlayback();
  const { carouselSpeed, lineGap, fontSize } = useLyricView();
  const [deskOpen, setDeskOpen] = useState(false);
  const [deskLyricId, setDeskLyricId] = useState<number | null>(null);
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
  const trackingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const pointerYRef = useRef(0);
  const pointerStartYRef = useRef(0);
  const lastTapRef = useRef({ t: 0, x: 0, y: 0 });
  const pointerDownAtRef = useRef(0);
  const tapToggleTimerRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  const canPlayRef = useRef(canPlay);
  const timingRef = useRef({ slideIntervalMs, animationMs, dataLength: 0 });
  pausedRef.current = paused;
  canPlayRef.current = canPlay;
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
      const elapsed = currentElapsed();
      const maxIndex = Math.max(dataLength - 1, 0);
      const activeIndex = Math.min(
        Math.floor(elapsed / previousInterval),
        maxIndex
      );
      const age = elapsed - activeIndex * previousInterval;
      const endedAt = runEndedAt(dataLength, slideIntervalMs, animationMs);
      const nextElapsed = Math.min(
        endedAt,
        activeIndex * slideIntervalMs + age
      );

      writeElapsed(nextElapsed);
    }

    intervalRef.current = slideIntervalMs;

    if (finished && !scrubbingRef.current) {
      return;
    }

    const elapsed = currentElapsed();

    if (
      paused &&
      !scrubbingRef.current &&
      !hasReadableSlide(elapsed, dataLength, slideIntervalMs, animationMs)
    ) {
      const endedAt = runEndedAt(dataLength, slideIntervalMs, animationMs);
      writeElapsed(Math.min(endedAt, READABLE_PROGRESS * animationMs));
    }

    setLastIndex(currentPositions());
  }, [
    animationMs,
    currentPositions,
    data,
    dataLength,
    finished,
    paused,
    slideIntervalMs,
    writeElapsed,
  ]);

  useEffect(() => {
    setCanPlay(!finished);

    return () => {
      setCanPlay(false);
    };
  }, [finished, setCanPlay]);

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

  const clearTapToggle = () => {
    if (tapToggleTimerRef.current === null) {
      return;
    }

    window.clearTimeout(tapToggleTimerRef.current);
    tapToggleTimerRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearTapToggle();
    };
  }, []);

  const openMessageDesk = (catalogId: number) => {
    clearTapToggle();
    suppressToggle();
    setPaused(true);
    setDeskLyricId(catalogId);
    setDeskOpen(true);
  };

  const lyricIdForPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    return catalogIdFromEvent(event) ?? data[lastIndex]?.id ?? null;
  };

  const tryOpenFromDoubleTap = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isNearLastTap(lastTapRef.current, event.clientX, event.clientY)) {
      return false;
    }

    const catalogId = lyricIdForPointer(event);

    if (catalogId === null) {
      return false;
    }

    lastTapRef.current = { t: 0, x: 0, y: 0 };
    trackingRef.current = false;
    scrubbingRef.current = false;
    event.preventDefault();
    event.stopPropagation();
    openMessageDesk(catalogId);
    return true;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    if (eventElement(event)?.closest('button')) {
      return;
    }

    if (tryOpenFromDoubleTap(event)) {
      return;
    }

    if (catalogIdFromEvent(event) !== null) {
      suppressToggle();
    }

    pointerDownAtRef.current = Date.now();
    pointerYRef.current = event.clientY;
    pointerStartYRef.current = event.clientY;
    wasPlayingRef.current = !paused;
    scrubbingRef.current = false;
    trackingRef.current = true;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !trackingRef.current &&
      !event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      return;
    }

    const deltaY = event.clientY - pointerYRef.current;
    pointerYRef.current = event.clientY;

    if (!scrubbingRef.current) {
      const travel = Math.abs(event.clientY - pointerStartYRef.current);
      const heldMs = Date.now() - pointerDownAtRef.current;

      if (travel < SCRUB_PX) {
        return;
      }

      if (heldMs < SCRUB_HOLD_MS && travel < SCRUB_CLICK_SLIP_PX) {
        return;
      }

      clearTapToggle();
      scrubbingRef.current = true;
      trackingRef.current = false;
      lastTapRef.current = { t: 0, x: 0, y: 0 };
      event.currentTarget.setPointerCapture(event.pointerId);
      suppressToggle();

      if (wasPlayingRef.current) {
        setPaused(true);
      }

      seekByDeltaY(event.clientY - pointerStartYRef.current);
      return;
    }

    seekByDeltaY(deltaY);
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const wasTracking = trackingRef.current;
    trackingRef.current = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (scrubbingRef.current) {
      scrubbingRef.current = false;
      clearTapToggle();
      suppressToggle();

      if (wasPlayingRef.current) {
        setPaused(false);
      }

      return;
    }

    if (!wasTracking || event.type === 'pointercancel') {
      return;
    }

    if (tryOpenFromDoubleTap(event)) {
      return;
    }

    lastTapRef.current = {
      t: Date.now(),
      x: event.clientX,
      y: event.clientY,
    };

    if (catalogIdFromEvent(event) === null) {
      return;
    }

    suppressToggle();
    clearTapToggle();
    tapToggleTimerRef.current = window.setTimeout(() => {
      tapToggleTimerRef.current = null;

      if (!canPlayRef.current) {
        return;
      }

      setPaused(!pausedRef.current);
    }, DOUBLE_TAP_MS);
  };

  const firstVisible = Math.max(
    0,
    lastIndex - Math.ceil(animationMs / slideIntervalMs)
  );
  const visibleSlides = finished ? [] : data.slice(firstVisible, lastIndex + 1);
  const deskLyric = useMemo(
    () => lyrics.find((item) => item.id === deskLyricId) ?? null,
    [deskLyricId, lyrics]
  );

  return (
    <div
      className="lyric-viewport relative min-h-0 w-full flex-1 touch-none overflow-hidden select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onDoubleClick={(event) => {
        event.preventDefault();
      }}
    >
      {visibleSlides.map((item, offset) => {
        const index = firstVisible + offset;

        return (
          <div
            key={`${item.lyric_id}_${item.message?.message_id}_${index}`}
            className="lyric"
            data-catalog-id={item.id}
            ref={(node) => {
              if (node) {
                nodesRef.current.set(index, node);
                const timing = timingRef.current;
                applyPositions(
                  nodesRef.current,
                  elapsedSinceStart(
                    originRef.current,
                    pausedAccumRef.current,
                    pauseStartedRef.current
                  ),
                  timing.dataLength,
                  timing.slideIntervalMs,
                  timing.animationMs
                );
              } else {
                nodesRef.current.delete(index);
              }
            }}
          >
            <LyricItem item={item} />
          </div>
        );
      })}

      <MessageDeskDialog
        lyric={deskLyric}
        open={deskOpen}
        queryVariables={queryVariables}
        onOpenChange={setDeskOpen}
        onHidden={() => {
          setDeskOpen(false);
        }}
      />

      {finished ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <Button
            type="button"
            size="lg"
            className="pointer-events-auto"
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
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
