'use client';

import { ArrowRight, Trash2 } from 'lucide-react';

import type { ILyricCollage } from '@/entities/lyric';
import {
  HISTORY_SWIPE_REVEAL_PX,
  useHistoryRowGestures,
} from '@/features/carousel-history';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';

import { collagePreviewText } from '../lib/generator-text';

export function CatalogAssembleHistoryItem({
  collage,
  hideAdlibs,
  selected,
  revealed,
  onSelect,
  onRevealChange,
  onPlay,
  onDelete,
}: {
  collage: ILyricCollage;
  hideAdlibs: boolean;
  selected: boolean;
  revealed: boolean;
  onSelect: () => void;
  onRevealChange: (open: boolean) => void;
  onPlay: () => void;
  onDelete: () => void;
}) {
  const { offset, dragging, rowProps } = useHistoryRowGestures({
    revealed,
    onRevealChange,
    onLongPress: () => undefined,
    onTap: onSelect,
  });
  const preview = collagePreviewText(collage.slots, hideAdlibs);
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
          size="icon"
          className="size-8 shrink-0"
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
          'hover:bg-muted relative z-10 flex w-full items-center gap-1 rounded-md bg-background px-3 py-2.5 select-none',
          selected && 'bg-muted',
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
        <p className="min-w-0 flex-1 text-sm leading-snug whitespace-pre-wrap line-clamp-2">
          {preview}
        </p>
        {selected ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
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
