'use client';

import {
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from 'react';

const DISMISS_PX = 88;
const HANDLE_ZONE_PX = 88;

function isSwipeBlocked(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, button, a, [data-swipe-ignore], [role="slider"]'
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

  const reset = () => {
    draggingRef.current = false;
    setOffset(0);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || event.button !== 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const fromHandle = event.clientY - rect.top <= HANDLE_ZONE_PX;

    if (!fromHandle && isSwipeBlocked(event.target)) {
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

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current) {
      return;
    }

    const next = Math.max(0, event.clientY - startYRef.current);
    draggingRef.current = false;

    if (next >= DISMISS_PX) {
      setOffset(0);
      onDismiss();
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
