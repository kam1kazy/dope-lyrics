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
  likedLineKey,
  useCarouselSession,
} from '@/shared/lib/carousel-session/carousel-session-context';
import {
  slideTiming,
  useLyricView,
} from '@/shared/lib/lyric-view/lyric-view-context';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { Button } from '@/shared/ui/shadcn/ui/button';

import {
  approachVelocity,
  BRAKE_TAU_MS,
  COAST_TAU_MS,
  deltaYToElapsedMs,
  END_Y_VH,
  type FlickSample,
  HOLD_TAP_MS,
  pushFlickSample,
  resolveFlickVelocity,
  START_Y_VH,
  VELOCITY_EPS,
} from '../lib/carousel-motion';

interface ViewportProps {
  data: LyricSlide[];
  lyrics: ILyric[];
  queryVariables: LyricsQueryVariables;
  hasMore: boolean;
  onNeedMore: () => void;
}

const FADE_IN = 0.08;
const FADE_OUT = 0.12;
const READABLE_PROGRESS = 0.42;
const SCRUB_PX = 20;
const DOUBLE_TAP_MS = 400;
const DOUBLE_TAP_PX = 48;
const AXIS_MOVE_PX = 8;
const LIKE_SWIPE_PX = 36;
const LIKE_FLASH_MS = 320;

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

function slideHitAtPoint(root: HTMLElement, x: number, y: number) {
  const hits: { id: number; lineIndex: number; dist: number }[] = [];

  for (const node of root.querySelectorAll<HTMLElement>('[data-catalog-id]')) {
    if (node.style.visibility === 'hidden') {
      continue;
    }

    const content = node.querySelector<HTMLElement>('[data-lyric-hit]') ?? node;
    const rect = content.getBoundingClientRect();

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      continue;
    }

    const id = Number(node.getAttribute('data-catalog-id'));
    const lineIndex = Number(node.getAttribute('data-line-index'));

    if (!Number.isFinite(id) || !Number.isFinite(lineIndex)) {
      continue;
    }

    const dx = x - (rect.left + rect.width / 2);
    const dy = y - (rect.top + rect.height / 2);
    hits.push({ id, lineIndex, dist: dx * dx + dy * dy });
  }

  hits.sort((a, b) => a.dist - b.dist);

  return hits[0] ?? null;
}

function catalogIdAtPoint(root: HTMLElement, x: number, y: number) {
  return slideHitAtPoint(root, x, y)?.id ?? null;
}

function catalogIdFromEvent(event: ReactPointerEvent<HTMLDivElement>) {
  return catalogIdAtPoint(event.currentTarget, event.clientX, event.clientY);
}

function slideHitFromEvent(event: ReactPointerEvent<HTMLDivElement>) {
  return slideHitAtPoint(event.currentTarget, event.clientX, event.clientY);
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

const PRELOAD_SLIDES = 24;

export function Viewport({
  data,
  lyrics,
  queryVariables,
  hasMore,
  onNeedMore,
}: ViewportProps) {
  const {
    paused,
    canPlay,
    setPaused,
    setCanPlay,
    suppressToggle,
    beginOverlay,
    endOverlay,
  } = usePlayback();
  const { carouselSpeed, lineGap, fontSize } = useLyricView();
  const { likedLines, toggleLike } = useCarouselSession();
  const likedKeySet = useMemo(
    () => new Set(likedLines.map((line) => line.key)),
    [likedLines]
  );
  const [deskOpen, setDeskOpen] = useState(false);
  const [deskLyricId, setDeskLyricId] = useState<number | null>(null);
  const [deskLyricSnapshot, setDeskLyricSnapshot] = useState<ILyric | null>(
    null
  );
  const [flashLikeKey, setFlashLikeKey] = useState<string | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const { slideIntervalMs, animationMs } = slideTiming(
    carouselSpeed,
    lineGap,
    fontSize
  );
  const elapsedRef = useRef(0);
  const velocityRef = useRef(1);
  const targetVelocityRef = useRef(1);
  const tauRef = useRef(BRAKE_TAU_MS);
  const lastTickRef = useRef<number | null>(null);
  const holdingRef = useRef(false);
  const intervalRef = useRef(slideIntervalMs);
  const nodesRef = useRef(new Map<number, HTMLDivElement>());
  const scrubbingRef = useRef(false);
  const trackingRef = useRef(false);
  const pointerYRef = useRef(0);
  const pointerStartYRef = useRef(0);
  const pointerStartXRef = useRef(0);
  const axisRef = useRef<'pending' | 'x' | 'y'>('pending');
  const likeSwipedRef = useRef(false);
  const likeTargetRef = useRef<{
    lyricId: number;
    lineIndex: number;
    text: string;
  } | null>(null);
  const lastTapRef = useRef({ t: 0, x: 0, y: 0 });
  const pointerDownAtRef = useRef(0);
  const flickSamplesRef = useRef<FlickSample[]>([]);
  const tapToggleTimerRef = useRef<number | null>(null);
  const readableSnapDoneRef = useRef(false);
  const pausedRef = useRef(paused);
  const canPlayRef = useRef(canPlay);
  const timingRef = useRef({ slideIntervalMs, animationMs, dataLength: 0 });
  const hasMoreRef = useRef(hasMore);
  const onNeedMoreRef = useRef(onNeedMore);
  const ensureLoopRef = useRef<() => void>(() => {});
  pausedRef.current = paused;
  canPlayRef.current = canPlay;
  hasMoreRef.current = hasMore;
  onNeedMoreRef.current = onNeedMore;
  const [lastIndex, setLastIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const finishedRef = useRef(finished);
  finishedRef.current = finished;
  const dataLength = data.length;
  timingRef.current = { slideIntervalMs, animationMs, dataLength };

  const showLikeFlash = useCallback((key: string) => {
    if (flashTimerRef.current != null) {
      window.clearTimeout(flashTimerRef.current);
    }

    setFlashLikeKey(key);
    flashTimerRef.current = window.setTimeout(() => {
      flashTimerRef.current = null;
      setFlashLikeKey(null);
    }, LIKE_FLASH_MS);
  }, []);

  const writeElapsed = useCallback((nextMs: number) => {
    elapsedRef.current = Math.max(0, nextMs);
  }, []);

  const currentPositions = useCallback(() => {
    return applyPositions(
      nodesRef.current,
      elapsedRef.current,
      dataLength,
      slideIntervalMs,
      animationMs
    );
  }, [animationMs, dataLength, slideIntervalMs]);

  const cruiseTarget = useCallback(() => {
    if (holdingRef.current || scrubbingRef.current) {
      return 0;
    }

    if (pausedRef.current || finishedRef.current) {
      return 0;
    }

    return 1;
  }, []);

  const setMotionTarget = useCallback((target: number, tauMs: number) => {
    targetVelocityRef.current = target;
    tauRef.current = tauMs;
    ensureLoopRef.current();
  }, []);

  const releaseSoftHold = useCallback(
    (opts?: { pendingTap?: boolean }) => {
      holdingRef.current = false;
      scrubbingRef.current = false;

      // Короткий тап: держим тормоз, пока toggle/click выставит hard-pause
      if (opts?.pendingTap) {
        setMotionTarget(0, BRAKE_TAU_MS);
        return;
      }

      setMotionTarget(cruiseTarget(), BRAKE_TAU_MS);
    },
    [cruiseTarget, setMotionTarget]
  );

  const restart = useCallback(() => {
    elapsedRef.current = 0;
    velocityRef.current = 1;
    targetVelocityRef.current = 1;
    tauRef.current = BRAKE_TAU_MS;
    lastTickRef.current = null;
    holdingRef.current = false;
    scrubbingRef.current = false;
    readableSnapDoneRef.current = false;
    setFinished(false);
    setLastIndex(0);
    setPaused(false);
    ensureLoopRef.current();
  }, [setPaused]);

  const seekByDeltaY = useCallback(
    (deltaY: number) => {
      const { animationMs: timingAnimation, slideIntervalMs: timingInterval } =
        timingRef.current;
      const deltaMs = deltaYToElapsedMs(deltaY, timingAnimation);
      const endedAt = runEndedAt(dataLength, timingInterval, timingAnimation);
      const next = Math.min(endedAt, Math.max(0, elapsedRef.current + deltaMs));

      writeElapsed(next);
      setLastIndex(currentPositions());
      setFinished(next >= endedAt && dataLength > 0 && !hasMoreRef.current);
    },
    [currentPositions, dataLength, writeElapsed]
  );

  useLayoutEffect(() => {
    const previousInterval = intervalRef.current;

    if (previousInterval !== slideIntervalMs && previousInterval > 0) {
      const elapsed = elapsedRef.current;
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
    setLastIndex(currentPositions());
  }, [
    animationMs,
    currentPositions,
    data,
    dataLength,
    slideIntervalMs,
    writeElapsed,
  ]);

  useEffect(() => {
    setCanPlay(!finished);

    return () => {
      setCanPlay(false);
    };
  }, [finished, setCanPlay]);

  // Hard-pause / resume: только цель скорости, без мгновенного freeze
  useEffect(() => {
    if (holdingRef.current || scrubbingRef.current) {
      return;
    }

    readableSnapDoneRef.current = false;

    if (paused) {
      setMotionTarget(0, BRAKE_TAU_MS);
    } else if (!finished) {
      setMotionTarget(1, BRAKE_TAU_MS);
    }
  }, [finished, paused, setMotionTarget]);

  useEffect(() => {
    if (finished) {
      velocityRef.current = 0;
      targetVelocityRef.current = 0;
      ensureLoopRef.current = () => {};
      return;
    }

    let frame = 0;
    let stopped = false;
    let running = false;

    const tick = (now: number) => {
      if (stopped) {
        running = false;
        return;
      }

      const last = lastTickRef.current;
      lastTickRef.current = now;
      const dt = last === null ? 0 : Math.min(48, Math.max(0, now - last));
      const { animationMs: timingAnimation, slideIntervalMs: timingInterval } =
        timingRef.current;
      const endedAt = runEndedAt(
        timingRef.current.dataLength,
        timingInterval,
        timingAnimation
      );

      if (!scrubbingRef.current) {
        velocityRef.current = approachVelocity(
          velocityRef.current,
          targetVelocityRef.current,
          dt,
          tauRef.current
        );

        if (dt > 0 && Math.abs(velocityRef.current) > VELOCITY_EPS) {
          const next = Math.min(
            endedAt,
            Math.max(0, elapsedRef.current + dt * velocityRef.current)
          );
          elapsedRef.current = next;
        }
      }

      const elapsed = elapsedRef.current;

      // Снап к читаемой строке только после hard-pause, когда лента почти стоит
      if (
        pausedRef.current &&
        !holdingRef.current &&
        !scrubbingRef.current &&
        Math.abs(velocityRef.current) <= VELOCITY_EPS &&
        !readableSnapDoneRef.current &&
        !hasReadableSlide(
          elapsed,
          timingRef.current.dataLength,
          timingInterval,
          timingAnimation
        )
      ) {
        readableSnapDoneRef.current = true;
        elapsedRef.current = Math.min(
          endedAt,
          READABLE_PROGRESS * timingAnimation
        );
        currentPositions();
      }

      if (elapsedRef.current >= endedAt) {
        currentPositions();

        if (hasMoreRef.current) {
          onNeedMoreRef.current();
          frame = requestAnimationFrame(tick);
          return;
        }

        velocityRef.current = 0;
        targetVelocityRef.current = 0;
        running = false;
        lastTickRef.current = null;
        setFinished(true);
        return;
      }

      const nextIndex = currentPositions();
      setLastIndex((current) => (current === nextIndex ? current : nextIndex));

      const idle =
        !scrubbingRef.current &&
        Math.abs(velocityRef.current) <= VELOCITY_EPS &&
        Math.abs(targetVelocityRef.current) <= VELOCITY_EPS;

      // Покой на hard-pause или после тормоза зажатием — кадры не крутим
      if (idle && (pausedRef.current || holdingRef.current)) {
        running = false;
        lastTickRef.current = null;
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (stopped || running || finishedRef.current) {
        return;
      }

      running = true;
      lastTickRef.current = null;
      frame = requestAnimationFrame(tick);
    };

    ensureLoopRef.current = ensureLoop;
    ensureLoop();

    const sync = () => {
      setLastIndex(currentPositions());
      ensureLoop();
    };

    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('pageshow', sync);

    return () => {
      stopped = true;
      running = false;
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('pageshow', sync);
    };
  }, [currentPositions, finished]);

  useEffect(() => {
    if (finished || !hasMore || dataLength === 0) {
      return;
    }

    if (dataLength - lastIndex <= PRELOAD_SLIDES) {
      onNeedMore();
    }
  }, [dataLength, finished, hasMore, lastIndex, onNeedMore]);

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
      if (flashTimerRef.current != null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onTouchMove = (event: TouchEvent) => {
      if (
        !trackingRef.current &&
        !scrubbingRef.current &&
        !holdingRef.current
      ) {
        return;
      }

      event.preventDefault();
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  useEffect(() => {
    if (!deskOpen) {
      return;
    }

    beginOverlay();
    return () => {
      endOverlay();
    };
  }, [beginOverlay, deskOpen, endOverlay]);

  const openMessageDesk = (catalogId: number) => {
    clearTapToggle();
    suppressToggle();
    holdingRef.current = false;
    scrubbingRef.current = false;
    setMotionTarget(0, BRAKE_TAU_MS);
    setPaused(true);
    setDeskLyricSnapshot(lyrics.find((item) => item.id === catalogId) ?? null);
    setDeskLyricId(catalogId);
    setDeskOpen(true);
  };

  const tryOpenFromDoubleTap = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isNearLastTap(lastTapRef.current, event.clientX, event.clientY)) {
      return false;
    }

    const catalogId = catalogIdFromEvent(event);

    if (catalogId === null) {
      return false;
    }

    lastTapRef.current = { t: 0, x: 0, y: 0 };
    trackingRef.current = false;
    scrubbingRef.current = false;
    holdingRef.current = false;
    event.preventDefault();
    event.stopPropagation();
    openMessageDesk(catalogId);
    return true;
  };

  const applyLikeSwipe = (target: {
    lyricId: number;
    lineIndex: number;
    text: string;
  }) => {
    toggleLike(target);
    showLikeFlash(likedLineKey(target.lyricId, target.lineIndex));

    likeSwipedRef.current = true;
    lastTapRef.current = { t: 0, x: 0, y: 0 };
    clearTapToggle();
    suppressToggle();
  };

  const beginSoftHold = () => {
    holdingRef.current = true;
    scrubbingRef.current = false;
    flickSamplesRef.current = [];
    setMotionTarget(0, BRAKE_TAU_MS);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || deskOpen) {
      return;
    }

    if (eventElement(event)?.closest('button')) {
      return;
    }

    if (tryOpenFromDoubleTap(event)) {
      return;
    }

    const hit = slideHitFromEvent(event);
    const slide = hit
      ? data.find(
          (item) =>
            item.id === hit.id && item.message?.message_id === hit.lineIndex
        )
      : null;
    likeTargetRef.current =
      hit && slide
        ? {
            lyricId: hit.id,
            lineIndex: hit.lineIndex,
            text: slide.message?.text ?? '',
          }
        : null;

    if (hit !== null) {
      suppressToggle();
    }

    pointerDownAtRef.current = Date.now();
    pointerYRef.current = event.clientY;
    pointerStartYRef.current = event.clientY;
    pointerStartXRef.current = event.clientX;
    axisRef.current = 'pending';
    likeSwipedRef.current = false;
    trackingRef.current = true;
    beginSoftHold();
    pushFlickSample(flickSamplesRef.current, event.clientY);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (deskOpen) {
      return;
    }

    if (
      !trackingRef.current &&
      !holdingRef.current &&
      !event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      return;
    }

    const dx = event.clientX - pointerStartXRef.current;
    const dy = event.clientY - pointerStartYRef.current;

    if (axisRef.current === 'pending' && trackingRef.current) {
      if (Math.abs(dx) < AXIS_MOVE_PX && Math.abs(dy) < AXIS_MOVE_PX) {
        return;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        axisRef.current = 'x';
        clearTapToggle();
        lastTapRef.current = { t: 0, x: 0, y: 0 };
        suppressToggle();
        event.currentTarget.setPointerCapture(event.pointerId);
      } else {
        axisRef.current = 'y';
      }
    }

    if (axisRef.current === 'x') {
      if (
        !likeSwipedRef.current &&
        dx <= -LIKE_SWIPE_PX &&
        likeTargetRef.current !== null
      ) {
        applyLikeSwipe(likeTargetRef.current);
      }

      return;
    }

    if (axisRef.current !== 'y') {
      return;
    }

    const deltaY = event.clientY - pointerYRef.current;
    pointerYRef.current = event.clientY;
    pushFlickSample(flickSamplesRef.current, event.clientY);

    if (!scrubbingRef.current) {
      const travel = Math.abs(event.clientY - pointerStartYRef.current);

      if (travel < SCRUB_PX) {
        return;
      }

      clearTapToggle();
      scrubbingRef.current = true;
      trackingRef.current = false;
      velocityRef.current = 0;
      setMotionTarget(0, BRAKE_TAU_MS);
      lastTapRef.current = { t: 0, x: 0, y: 0 };
      event.currentTarget.setPointerCapture(event.pointerId);
      suppressToggle();

      seekByDeltaY(event.clientY - pointerStartYRef.current);
      return;
    }

    seekByDeltaY(deltaY);
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (deskOpen) {
      trackingRef.current = false;
      scrubbingRef.current = false;
      holdingRef.current = false;
      axisRef.current = 'pending';
      return;
    }

    const wasTracking = trackingRef.current;
    const wasScrubbing = scrubbingRef.current;
    const wasHolding = holdingRef.current;
    const wasLikeAxis = axisRef.current === 'x';
    const heldMs = Date.now() - pointerDownAtRef.current;
    const dx = event.clientX - pointerStartXRef.current;
    trackingRef.current = false;
    axisRef.current = 'pending';

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (wasLikeAxis) {
      const target = likeTargetRef.current;
      likeTargetRef.current = null;

      // если порог уже сработал на move — повторно не лайкаем
      if (!likeSwipedRef.current && dx <= -LIKE_SWIPE_PX && target !== null) {
        applyLikeSwipe(target);
      }

      scrubbingRef.current = false;
      clearTapToggle();
      suppressToggle();
      releaseSoftHold();
      return;
    }

    likeTargetRef.current = null;

    if (wasScrubbing) {
      const flick = resolveFlickVelocity(
        flickSamplesRef.current,
        timingRef.current.animationMs
      );
      flickSamplesRef.current = [];
      scrubbingRef.current = false;
      holdingRef.current = false;
      clearTapToggle();
      suppressToggle();

      if (flick !== 0) {
        velocityRef.current = flick;
        setMotionTarget(cruiseTarget(), COAST_TAU_MS);
      } else {
        setMotionTarget(cruiseTarget(), BRAKE_TAU_MS);
      }

      return;
    }

    if (
      !wasTracking ||
      event.type === 'pointercancel' ||
      likeSwipedRef.current
    ) {
      if (wasHolding) {
        flickSamplesRef.current = [];
        releaseSoftHold();
      }

      return;
    }

    // Долгое зажатие — не клик-пауза, просто отпустить тормоз
    if (heldMs >= HOLD_TAP_MS) {
      flickSamplesRef.current = [];
      clearTapToggle();
      suppressToggle();
      releaseSoftHold();
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

    const hitId = catalogIdFromEvent(event);
    flickSamplesRef.current = [];

    // Короткий тап: тормоз держим, пока сработает toggle (строка или пустое → app-shell)
    releaseSoftHold({ pendingTap: true });

    if (hitId === null) {
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
  const deskLyric = useMemo(() => {
    const live = lyrics.find((item) => item.id === deskLyricId);

    if (live) {
      return live;
    }

    if (deskLyricSnapshot?.id === deskLyricId) {
      return deskLyricSnapshot;
    }

    return null;
  }, [deskLyricId, deskLyricSnapshot, lyrics]);

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
            data-line-index={item.message?.message_id ?? 0}
            ref={(node) => {
              if (node) {
                nodesRef.current.set(index, node);
                const timing = timingRef.current;
                applyPositions(
                  nodesRef.current,
                  elapsedRef.current,
                  timing.dataLength,
                  timing.slideIntervalMs,
                  timing.animationMs
                );
              } else {
                nodesRef.current.delete(index);
              }
            }}
          >
            <LyricItem
              item={item}
              liked={likedKeySet.has(
                likedLineKey(item.id, item.message?.message_id ?? 0)
              )}
              flashLike={
                flashLikeKey ===
                likedLineKey(item.id, item.message?.message_id ?? 0)
              }
            />
          </div>
        );
      })}

      <MessageDeskDialog
        lyric={deskLyric}
        open={deskOpen}
        queryVariables={queryVariables}
        onLyricChange={(next) => {
          setDeskLyricId(next.id);
          setDeskLyricSnapshot(next);
        }}
        onOpenChange={(open) => {
          setDeskOpen(open);

          if (!open) {
            setDeskLyricId(null);
            setDeskLyricSnapshot(null);
          }
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
