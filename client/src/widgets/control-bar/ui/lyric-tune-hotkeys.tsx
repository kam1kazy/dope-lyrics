'use client';

import {
  AlignVerticalSpaceAround,
  CircleGauge,
  Type,
  UnfoldVertical,
} from 'lucide-react';
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
  useState,
} from 'react';

import { useLyricView } from '@/shared/lib/lyric-view/lyric-view-context';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { chromeKeyClass } from '@/shared/lib/utils/chrome-key-class';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';

const DRAG_RANGE_PX = 180;
const RING_MIN_PX = 40;
const RING_MAX_PX = 112;

const TUNES = [
  {
    id: 'fontSize',
    label: 'Размер текста',
    icon: Type,
    min: 16,
    max: 36,
    step: 1,
  },
  {
    id: 'lineHeight',
    label: 'Межстрочие',
    icon: AlignVerticalSpaceAround,
    min: 1.1,
    max: 1.9,
    step: 0.05,
  },
  {
    id: 'lineGap',
    label: 'Отступ',
    icon: UnfoldVertical,
    min: 1,
    max: 10,
    step: 0.05,
  },
  {
    id: 'carouselSpeed',
    label: 'Скорость',
    icon: CircleGauge,
    min: 1,
    max: 10,
    step: 1,
  },
] as const;

type TuneId = (typeof TUNES)[number]['id'];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function snap(value: number, min: number, max: number, step: number) {
  const snapped = Math.round((value - min) / step) * step + min;

  return clamp(Number(snapped.toFixed(2)), min, max);
}

function ratioOf(value: number, min: number, max: number) {
  return clamp((value - min) / (max - min), 0, 1);
}

export function LyricTuneHotkeys() {
  const {
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    lineGap,
    setLineGap,
    carouselSpeed,
    setCarouselSpeed,
  } = useLyricView();
  const { paused, canPlay, suppressToggle } = usePlayback();
  const playing = !paused && canPlay;
  const [activeId, setActiveId] = useState<TuneId | null>(null);
  const [dragRatio, setDragRatio] = useState(0);
  const dragRef = useRef<{
    id: TuneId;
    startY: number;
    startRatio: number;
  } | null>(null);

  const values: Record<TuneId, number> = {
    fontSize,
    lineHeight,
    lineGap,
    carouselSpeed,
  };

  const setters: Record<TuneId, (value: number) => void> = {
    fontSize: setFontSize,
    lineHeight: setLineHeight,
    lineGap: setLineGap,
    carouselSpeed: setCarouselSpeed,
  };

  const applyDrag = useCallback(
    (clientY: number) => {
      const drag = dragRef.current;

      if (!drag) {
        return;
      }

      const tune = TUNES.find((item) => item.id === drag.id);

      if (!tune) {
        return;
      }

      const nextRatio = clamp(
        drag.startRatio + (drag.startY - clientY) / DRAG_RANGE_PX,
        0,
        1
      );
      const next = snap(
        tune.min + nextRatio * (tune.max - tune.min),
        tune.min,
        tune.max,
        tune.step
      );

      setDragRatio(nextRatio);
      setters[tune.id](next);
    },
    [setCarouselSpeed, setFontSize, setLineGap, setLineHeight]
  );

  const onPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    id: TuneId
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressToggle();
    event.currentTarget.setPointerCapture(event.pointerId);

    const tune = TUNES.find((item) => item.id === id);

    if (!tune) {
      return;
    }

    dragRef.current = {
      id,
      startY: event.clientY,
      startRatio: ratioOf(values[id], tune.min, tune.max),
    };
    setDragRatio(ratioOf(values[id], tune.min, tune.max));
    setActiveId(id);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    applyDrag(event.clientY);
  };

  const endPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressToggle();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
    setActiveId(null);
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 transition-transform duration-500 ease-[cubic-bezier(0.05,0.85,0.15,1)] motion-reduce:transition-none',
        playing ? 'translate-y-0' : '-translate-y-16'
      )}
    >
      {TUNES.map(({ id, label, icon: Icon, min, max }) => {
        const active = activeId === id;
        const hidden = activeId !== null && !active;
        const ratio = active ? dragRatio : ratioOf(values[id], min, max);
        const percent = Math.round(ratio * 100);
        const ringScale =
          1 + ((RING_MAX_PX - RING_MIN_PX) / RING_MIN_PX) * ratio;

        return (
          <Button
            key={id}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            title={`${label}. Потяните вверх или вниз`}
            className={cn(
              'relative overflow-visible touch-none',
              chromeKeyClass({ playing, lit: active, hidden, drag: true })
            )}
            onClick={(event) => {
              event.stopPropagation();
            }}
            onPointerDown={(event) => onPointerDown(event, id)}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
          >
            {active ? (
              <>
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 text-xs tabular-nums text-foreground">
                  {percent}%
                </span>
                <span
                  className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-foreground/80 transition-transform duration-[320ms] ease-[cubic-bezier(0.05,0.85,0.15,1)] motion-reduce:transition-none"
                  style={{
                    width: RING_MIN_PX,
                    height: RING_MIN_PX,
                    transform: `translate(-50%, -50%) scale(${ringScale})`,
                  }}
                />
              </>
            ) : null}
            <Icon
              className={cn(
                'size-5 overflow-visible transition-transform',
                active && 'scale-125'
              )}
            />
          </Button>
        );
      })}
    </div>
  );
}
