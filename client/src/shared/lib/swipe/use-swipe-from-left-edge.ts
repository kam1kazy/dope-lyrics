'use client';

import { type PointerEvent as ReactPointerEvent, useRef } from 'react';

const OPEN_PX = 48;

interface UseSwipeFromLeftEdgeOptions {
  enabled: boolean;
  onOpen: () => void;
}

export function useSwipeFromLeftEdge({
  enabled,
  onOpen,
}: UseSwipeFromLeftEdgeOptions) {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const draggingRef = useRef(false);
  const openedRef = useRef(false);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const releaseCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const tryOpen = (clientX: number, clientY: number) => {
    if (openedRef.current) {
      return;
    }

    const dx = clientX - startXRef.current;
    const dy = Math.abs(clientY - startYRef.current);

    if (dx < OPEN_PX || dx <= dy) {
      return;
    }

    openedRef.current = true;
    onOpenRef.current();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || event.button !== 0) {
      return;
    }

    draggingRef.current = true;
    openedRef.current = false;
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.stopPropagation();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }

    tryOpen(event.clientX, event.clientY);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }

    draggingRef.current = false;
    tryOpen(event.clientX, event.clientY);
    releaseCapture(event);
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    openedRef.current = false;
    releaseCapture(event);
  };

  return {
    edgeProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
