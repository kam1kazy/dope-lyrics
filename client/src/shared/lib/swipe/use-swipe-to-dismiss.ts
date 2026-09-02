'use client';

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
  useState,
} from 'react';

const DISMISS_PX = 88;

function isSwipeBlocked(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, button, a, [data-swipe-ignore], [role="slider"], [role="tab"], [role="tablist"]'
    )
  );
}

interface UseSwipeToDismissOptions {
  enabled: boolean;
  onDismiss: () => void;
}

export function useSwipeToDismiss({
  enabled,
  onDismiss,
}: UseSwipeToDismissOptions) {
  const startYRef = useRef(0);
  const draggingRef = useRef(false);
  const [offset, setOffset] = useState(0);

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const reset = useCallback(() => {
    draggingRef.current = false;
    setOffset(0);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || event.button !== 0) {
      return;
    }

    if (isSwipeBlocked(event.target)) {
      return;
    }

    draggingRef.current = true;
    startYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current) {
      return;
    }

    const next = Math.max(0, event.clientY - startYRef.current);
    setOffset(next);
  };

  const releaseCapture = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current) {
      return;
    }

    const next = Math.max(0, event.clientY - startYRef.current);
    draggingRef.current = false;
    releaseCapture(event);

    if (next >= DISMISS_PX) {
      onDismissRef.current();
      return;
    }

    setOffset(0);
  };

  return {
    offset,
    dragging: offset > 0,
    reset,
    contentProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
      style: {
        transform: offset > 0 ? `translate3d(0, ${offset}px, 0)` : undefined,
        transition: offset > 0 ? 'none' : undefined,
        touchAction: 'pan-y',
      } as const,
    },
  };
}
