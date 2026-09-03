'use client';

import { Scissors } from 'lucide-react';
import { useRef } from 'react';

import {
  isValidAfterLine,
  splitLyricLines,
} from '@/features/message-desk/lib/lyric-text-lines';

const HOLD_MS = 500;
const HOLD_MOVE_PX = 10;

interface SplitTextViewProps {
  afterLine: number;
  text: string;
  onAfterLineChange: (afterLine: number) => void;
  onHold: () => void;
}

export function SplitTextView({
  afterLine,
  text,
  onAfterLineChange,
  onHold,
}: SplitTextViewProps) {
  const lines = splitLyricLines(text);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const holdTimerRef = useRef<number | null>(null);
  const holdOriginRef = useRef<{ x: number; y: number } | null>(null);

  const clearHold = () => {
    if (holdTimerRef.current === null) {
      return;
    }

    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    holdOriginRef.current = null;
  };

  const snapToPointer = (clientY: number) => {
    let best = afterLine;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let index = 0; index < lines.length - 1; index += 1) {
      const current = lineRefs.current[index];
      const next = lineRefs.current[index + 1];

      if (!current || !next) {
        continue;
      }

      const gapY =
        (current.getBoundingClientRect().bottom +
          next.getBoundingClientRect().top) /
        2;
      const dist = Math.abs(clientY - gapY);

      if (dist < bestDist && isValidAfterLine(text, index)) {
        bestDist = dist;
        best = index;
      }
    }

    onAfterLineChange(best);
  };

  return (
    <div
      className="relative touch-none select-none px-5"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        holdOriginRef.current = { x: event.clientX, y: event.clientY };
        holdTimerRef.current = window.setTimeout(() => {
          holdTimerRef.current = null;
          holdOriginRef.current = null;
          const node = event.currentTarget;

          if (node.hasPointerCapture(event.pointerId)) {
            node.releasePointerCapture(event.pointerId);
          }

          onHold();
        }, HOLD_MS);
        snapToPointer(event.clientY);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
          return;
        }

        const origin = holdOriginRef.current;

        if (origin) {
          const dx = event.clientX - origin.x;
          const dy = event.clientY - origin.y;

          if (dx * dx + dy * dy > HOLD_MOVE_PX * HOLD_MOVE_PX) {
            clearHold();
          }
        }

        snapToPointer(event.clientY);
      }}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
    >
      {lines.map((line, index) => (
        <div key={`${index}-${line.slice(0, 12)}`}>
          <p
            ref={(node) => {
              lineRefs.current[index] = node;
            }}
            className="text-sm leading-relaxed sm:text-base sm:leading-7"
          >
            {line.length > 0 ? line : '\u00a0'}
          </p>
          {index === afterLine ? (
            <div className="relative h-0" aria-hidden>
              <div className="absolute -inset-x-5 top-0 flex -translate-y-1/2 items-center gap-1.5">
                <Scissors
                  className="text-muted-foreground size-3.5 shrink-0"
                  aria-hidden
                />
                <div className="border-muted-foreground/70 w-full border-t border-dashed" />
                <Scissors
                  className="text-muted-foreground size-3.5 shrink-0 -scale-x-100"
                  aria-hidden
                />
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
