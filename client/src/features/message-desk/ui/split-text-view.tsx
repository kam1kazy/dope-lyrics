'use client';

import { Minus, Plus, Scissors } from 'lucide-react';
import { useRef } from 'react';

import {
  canEnableSecondCut,
  isValidAfterLine,
  isValidLineRange,
  splitLyricLines,
} from '@/features/message-desk/lib/lyric-text-lines';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';

const HOLD_MS = 500;
const HOLD_MOVE_PX = 10;

interface SplitTextViewProps {
  afterLine: number;
  untilLine: number | null;
  takenLineIndexes?: number[];
  text: string;
  onAfterLineChange: (afterLine: number) => void;
  onUntilLineChange: (untilLine: number) => void;
  onToggleSecondCut: () => void;
  onHold: () => void;
}

export function SplitTextView({
  afterLine,
  untilLine,
  takenLineIndexes = [],
  text,
  onAfterLineChange,
  onUntilLineChange,
  onToggleSecondCut,
  onHold,
}: SplitTextViewProps) {
  const lines = splitLyricLines(text);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const holdTimerRef = useRef<number | null>(null);
  const holdOriginRef = useRef<{ x: number; y: number } | null>(null);
  const dragEdgeRef = useRef<'after' | 'until' | null>(null);
  const takenSet = new Set(takenLineIndexes);
  const dual = untilLine !== null;
  const canSecond = canEnableSecondCut(text);

  const clearHold = () => {
    if (holdTimerRef.current === null) {
      return;
    }

    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    holdOriginRef.current = null;
  };

  const gapYAfter = (lineIndex: number): number | null => {
    if (lineIndex === -1) {
      const first = lineRefs.current[0];
      return first ? first.getBoundingClientRect().top : null;
    }

    const current = lineRefs.current[lineIndex];
    const next = lineRefs.current[lineIndex + 1];

    if (current && next) {
      return (
        (current.getBoundingClientRect().bottom +
          next.getBoundingClientRect().top) /
        2
      );
    }

    if (current && !next) {
      return current.getBoundingClientRect().bottom;
    }

    return null;
  };

  const pickDragEdge = (clientY: number): 'after' | 'until' => {
    const afterY = gapYAfter(afterLine);
    const untilY = untilLine === null ? null : gapYAfter(untilLine);

    if (afterY === null) {
      return 'until';
    }

    if (untilY === null) {
      return 'after';
    }

    return Math.abs(clientY - untilY) < Math.abs(clientY - afterY)
      ? 'until'
      : 'after';
  };

  const snapAfter = (clientY: number, maxAfter: number) => {
    let bestAfter = afterLine;
    let bestAfterDist = Number.POSITIVE_INFINITY;

    for (let index = -1; index <= maxAfter; index += 1) {
      const gapY = gapYAfter(index);

      if (gapY === null) {
        continue;
      }

      if (dual) {
        if (untilLine === null || !isValidLineRange(text, index, untilLine)) {
          continue;
        }
      } else if (index >= 0 && !isValidAfterLine(text, index)) {
        continue;
      }

      const dist = Math.abs(clientY - gapY);

      if (dist < bestAfterDist) {
        bestAfterDist = dist;
        bestAfter = index;
      }
    }

    if (bestAfterDist < Number.POSITIVE_INFINITY) {
      onAfterLineChange(bestAfter);
    }
  };

  const snapUntil = (clientY: number) => {
    let bestUntil = untilLine ?? afterLine + 1;
    let bestUntilDist = Number.POSITIVE_INFINITY;

    for (let index = afterLine + 1; index < lines.length; index += 1) {
      const gapY = gapYAfter(index);

      if (gapY === null || !isValidLineRange(text, afterLine, index)) {
        continue;
      }

      const dist = Math.abs(clientY - gapY);

      if (dist < bestUntilDist) {
        bestUntilDist = dist;
        bestUntil = index;
      }
    }

    if (bestUntilDist < Number.POSITIVE_INFINITY) {
      onUntilLineChange(bestUntil);
    }
  };

  const snapToPointer = (clientY: number) => {
    if (!dual) {
      snapAfter(clientY, lines.length - 2);
      return;
    }

    if (dragEdgeRef.current === 'until') {
      snapUntil(clientY);
      return;
    }

    snapAfter(clientY, (untilLine ?? afterLine + 1) - 1);
  };

  const renderCut = (kind: 'after' | 'until') => {
    const isAfter = kind === 'after';

    return (
      <div className="relative h-0" aria-hidden>
        <div className="absolute -inset-x-5 top-0 flex -translate-y-1/2 items-center gap-1.5">
          {isAfter ? (
            <div className="flex shrink-0 flex-col items-center gap-0.5">
              {canSecond ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-6"
                  aria-label={
                    dual ? 'Убрать вторую черту' : 'Добавить вторую черту'
                  }
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleSecondCut();
                  }}
                >
                  {dual ? (
                    <Minus className="text-muted-foreground size-3.5" />
                  ) : (
                    <Plus className="text-muted-foreground size-3.5" />
                  )}
                </Button>
              ) : null}
              <Scissors
                className="text-muted-foreground size-3.5 shrink-0"
                aria-hidden
              />
            </div>
          ) : (
            <Scissors
              className="text-muted-foreground size-3.5 shrink-0"
              aria-hidden
            />
          )}
          <div
            className={cn(
              'w-full border-t border-dashed',
              dual ? 'border-sky-400/80' : 'border-muted-foreground/70'
            )}
          />
          <Scissors
            className="text-muted-foreground size-3.5 shrink-0 -scale-x-100"
            aria-hidden
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'relative touch-none select-none px-5',
        afterLine === -1 && 'pt-10',
        dual && untilLine === lines.length - 1 && 'pb-6'
      )}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        holdOriginRef.current = { x: event.clientX, y: event.clientY };
        dragEdgeRef.current = dual ? pickDragEdge(event.clientY) : 'after';
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
      onPointerUp={() => {
        clearHold();
        dragEdgeRef.current = null;
      }}
      onPointerCancel={() => {
        clearHold();
        dragEdgeRef.current = null;
      }}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
    >
      {lines.map((line, index) => {
        const inZone =
          dual && untilLine !== null && index > afterLine && index <= untilLine;
        const taken = takenSet.has(index);

        return (
          <div key={`${index}-${line.slice(0, 12)}`}>
            {afterLine === -1 && index === 0 ? renderCut('after') : null}
            <p
              ref={(node) => {
                lineRefs.current[index] = node;
              }}
              className={cn(
                'text-sm leading-relaxed sm:text-base sm:leading-7',
                inZone && 'bg-sky-400/10 rounded-sm',
                taken && 'opacity-35'
              )}
            >
              {line.length > 0 ? line : '\u00a0'}
            </p>
            {index === afterLine ? renderCut('after') : null}
            {dual && untilLine !== null && index === untilLine
              ? renderCut('until')
              : null}
          </div>
        );
      })}
    </div>
  );
}
