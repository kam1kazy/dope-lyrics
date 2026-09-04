'use client';

import { ArrowRight, Heart, Trash2 } from 'lucide-react';

import type { ICarouselHistory } from '@/entities/lyric';
import { formatRuDateTimeParts } from '@/shared/lib/format-datetime';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';

import {
  HISTORY_PREVIEW_COLLAPSED,
  HISTORY_PREVIEW_EXPANDED,
  HISTORY_SWIPE_REVEAL_PX,
  useHistoryRowGestures,
} from '../lib/use-history-row-gestures';

function previewLines(text: string, max: number) {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .slice(0, max)
    .join('\n');
}

export function CarouselHistoryItem({
  item,
  selected,
  expanded,
  revealed,
  onSelect,
  onToggleExpand,
  onRevealChange,
  onPlay,
  onLike,
  onUnlike,
  onDelete,
}: {
  item: ICarouselHistory;
  selected: boolean;
  expanded: boolean;
  revealed: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onRevealChange: (open: boolean) => void;
  onPlay: () => void;
  onLike: () => void;
  onUnlike: () => void;
  onDelete: () => void;
}) {
  const { offset, dragging, rowProps } = useHistoryRowGestures({
    revealed,
    onRevealChange,
    onLongPress: onToggleExpand,
    onTap: onSelect,
  });
  const { time, date } = formatRuDateTimeParts(item.createdAt);
  const lineMax = expanded
    ? HISTORY_PREVIEW_EXPANDED
    : HISTORY_PREVIEW_COLLAPSED;
  const deleteRevealed = revealed || dragging;

  return (
    <div data-history-item className="relative overflow-hidden rounded-md">
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
          'hover:bg-muted relative z-10 flex w-full items-center gap-1 rounded-md bg-background px-2 py-2 select-none',
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
        <time
          dateTime={item.createdAt}
          className="text-muted-foreground mr-2 shrink-0 text-[11px] leading-tight whitespace-nowrap tabular-nums"
        >
          <span className="block">{time}</span>
          {date ? <span className="block">{date}</span> : null}
        </time>
        <p
          aria-expanded={expanded}
          className={cn(
            'min-w-0 flex-1 text-sm leading-snug whitespace-pre-wrap',
            expanded ? 'line-clamp-[12]' : 'line-clamp-2'
          )}
        >
          {previewLines(item.previewText, lineMax) || 'Пустой снимок'}
        </p>
        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label={item.isLiked ? 'Убрать из сохранённых' : 'Сохранить'}
            onClick={(event) => {
              event.stopPropagation();
              if (item.isLiked) {
                onUnlike();
                return;
              }

              onLike();
            }}
          >
            <Heart
              className={cn(
                'size-4',
                item.isLiked && 'fill-rose-400 text-rose-400'
              )}
            />
          </Button>
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
    </div>
  );
}
