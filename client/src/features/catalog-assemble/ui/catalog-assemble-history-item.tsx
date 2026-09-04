'use client';

import { ArrowRight, Trash2 } from 'lucide-react';

import type { ILyricCollage } from '@/entities/lyric';
import {
  HISTORY_PREVIEW_EXPANDED,
  HISTORY_SWIPE_REVEAL_PX,
  useHistoryRowGestures,
} from '@/features/carousel-history';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';

import { collageCarouselText } from '../lib/generator-text';

function previewLines(text: string, max: number) {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .slice(0, max)
    .join('\n');
}

export function CatalogAssembleHistoryItem({
  collage,
  hideAdlibs,
  selected,
  expanded,
  revealed,
  onSelect,
  onToggleExpand,
  onRevealChange,
  onPlay,
  onDelete,
}: {
  collage: ILyricCollage;
  hideAdlibs: boolean;
  selected: boolean;
  expanded: boolean;
  revealed: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onRevealChange: (open: boolean) => void;
  onPlay: () => void;
  onDelete: () => void;
}) {
  const { offset, dragging, rowProps } = useHistoryRowGestures({
    revealed,
    onRevealChange,
    onLongPress: onToggleExpand,
    onTap: onSelect,
    onPress: onSelect,
  });
  const lineMax = expanded ? HISTORY_PREVIEW_EXPANDED : 1;
  const preview =
    previewLines(collageCarouselText(collage.slots, hideAdlibs), lineMax) ||
    'Пустая склейка';
  const deleteRevealed = revealed || dragging;

  return (
    <div
      data-assemble-history-item
      className="relative overflow-hidden rounded-md"
    >
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex items-center justify-end',
          !deleteRevealed && 'pointer-events-none opacity-0'
        )}
        style={{ width: HISTORY_SWIPE_REVEAL_PX }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          tabIndex={revealed ? 0 : -1}
          aria-hidden={!revealed}
          aria-label="Удалить"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="size-4 text-rose-400" />
        </Button>
      </div>
      <div
        {...rowProps}
        className={cn(
          'relative z-10 flex w-full items-center rounded-md bg-background px-3 py-2.5 select-none',
          '[@media(hover:hover)]:hover:bg-muted',
          selected && 'bg-muted pr-11',
          !dragging && 'transition-transform duration-200 ease-out'
        )}
        style={{
          transform: `translate3d(${offset}px, 0, 0)`,
          touchAction: 'pan-y',
        }}
        onDoubleClick={() => {
          onPlay();
        }}
      >
        <p
          aria-expanded={expanded}
          className={cn(
            'min-w-0 flex-1 overflow-hidden text-sm leading-5',
            expanded
              ? 'line-clamp-[12] max-h-60 break-words whitespace-pre-line'
              : 'h-5 truncate'
          )}
        >
          {preview}
        </p>
        {selected ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 leading-none"
            aria-label="Запустить в карусели"
            onClick={(event) => {
              event.stopPropagation();
              onPlay();
            }}
          >
            <ArrowRight className="size-4 text-emerald-400" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
