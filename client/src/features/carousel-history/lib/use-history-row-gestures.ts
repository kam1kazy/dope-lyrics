'use client';

import {
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from 'react';

export const HISTORY_PREVIEW_COLLAPSED = 2;
export const HISTORY_PREVIEW_EXPANDED = 12;
export const HISTORY_SWIPE_REVEAL_PX = 56;

const LONG_PRESS_MS = 520;
const MOVE_PX = 10;
const SNAP_PX = HISTORY_SWIPE_REVEAL_PX * 0.4;

function isRowControl(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button'));
}

export function useHistoryRowGestures({
  revealed,
  onRevealChange,
  onLongPress,
  onTap,
}: {
  revealed: boolean;
  onRevealChange: (open: boolean) => void;
  onLongPress: () => void;
  onTap: () => void;
}) {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const axisRef = useRef<'pending' | 'x' | 'y'>('pending');
  const didLongPressRef = useRef(false);
  const skipClickRef = useRef(false);
  const revealedRef = useRef(revealed);
  const onRevealChangeRef = useRef(onRevealChange);
  const onLongPressRef = useRef(onLongPress);
  const onTapRef = useRef(onTap);
  const dragOffsetRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  revealedRef.current = revealed;
  onRevealChangeRef.current = onRevealChange;
  onLongPressRef.current = onLongPress;
  onTapRef.current = onTap;

  const setDrag = (next: number | null) => {
    dragOffsetRef.current = next;
    setDragOffset(next);
  };

  const offset = dragOffset ?? (revealed ? -HISTORY_SWIPE_REVEAL_PX : 0);
  const dragging = dragOffset != null;

  const clearLongPress = () => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const releaseCapture = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerIdRef.current == null) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(pointerIdRef.current)) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
    }

    pointerIdRef.current = null;
  };

  const finishDrag = (nextOffset: number) => {
    const open = nextOffset <= -SNAP_PX;
    setDrag(null);
    onRevealChangeRef.current(open);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || isRowControl(event.target)) {
      return;
    }

    didLongPressRef.current = false;
    axisRef.current = 'pending';
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    startOffsetRef.current = revealedRef.current ? -HISTORY_SWIPE_REVEAL_PX : 0;
    pointerIdRef.current = event.pointerId;
    setDrag(null);

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      didLongPressRef.current = true;
      skipClickRef.current = true;
      onLongPressRef.current();
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const dx = event.clientX - startXRef.current;
    const dy = event.clientY - startYRef.current;

    if (axisRef.current === 'pending') {
      if (Math.abs(dx) < MOVE_PX && Math.abs(dy) < MOVE_PX) {
        return;
      }

      clearLongPress();

      if (Math.abs(dy) > Math.abs(dx)) {
        axisRef.current = 'y';
        pointerIdRef.current = null;
        return;
      }

      axisRef.current = 'x';
      skipClickRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (axisRef.current !== 'x') {
      return;
    }

    const next = Math.min(
      0,
      Math.max(-HISTORY_SWIPE_REVEAL_PX, startOffsetRef.current + dx)
    );
    setDrag(next);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerIdRef.current !== event.pointerId && axisRef.current !== 'x') {
      clearLongPress();
      pointerIdRef.current = null;
      return;
    }

    clearLongPress();
    const wasSwipe = axisRef.current === 'x';
    const nextOffset =
      dragOffsetRef.current ??
      (revealedRef.current ? -HISTORY_SWIPE_REVEAL_PX : 0);
    axisRef.current = 'pending';
    releaseCapture(event);

    if (wasSwipe) {
      finishDrag(nextOffset);
      return;
    }

    setDrag(null);

    if (didLongPressRef.current) {
      return;
    }
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    clearLongPress();
    axisRef.current = 'pending';
    setDrag(null);
    releaseCapture(event);
  };

  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    if (skipClickRef.current) {
      event.preventDefault();
      skipClickRef.current = false;
      return;
    }

    onTapRef.current();
  };

  const onContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
  };

  return {
    offset,
    dragging,
    rowProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onClick,
      onContextMenu,
    },
  };
}
