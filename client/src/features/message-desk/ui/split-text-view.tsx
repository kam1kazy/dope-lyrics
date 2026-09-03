'use client';

import { Scissors } from 'lucide-react';
import { useRef } from 'react';

import {
  isValidAfterLine,
  splitLyricLines,
} from '@/features/message-desk/lib/lyric-text-lines';

interface SplitTextViewProps {
  afterLine: number;
  text: string;
  onAfterLineChange: (afterLine: number) => void;
}

export function SplitTextView({
  afterLine,
  text,
  onAfterLineChange,
}: SplitTextViewProps) {
  const lines = splitLyricLines(text);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);

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
      className="relative touch-none select-none"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        snapToPointer(event.clientY);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
          return;
        }

        snapToPointer(event.clientY);
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
            <div className="relative my-1 flex h-4 items-center" aria-hidden>
              <Scissors
                className="text-muted-foreground size-3.5 shrink-0"
                aria-hidden
              />
              <div className="border-muted-foreground/70 ml-1 w-full border-t border-dashed" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
