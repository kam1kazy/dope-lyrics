'use client';

import { Reorder } from 'framer-motion';
import { GripVertical, X } from 'lucide-react';

import type { SliceChunk } from '@/features/message-desk/lib/lyric-text-lines';
import { previewLyricHalf } from '@/features/message-desk/lib/lyric-text-lines';
import { Button } from '@/shared/ui/shadcn/ui/button';

interface SliceChunkListProps {
  chunks: SliceChunk[];
  onReorder: (chunks: SliceChunk[]) => void;
  onRemove: (id: string) => void;
}

export function SliceChunkList({
  chunks,
  onReorder,
  onRemove,
}: SliceChunkListProps) {
  if (chunks.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Выделите зону двумя чертами и нажмите ножницы — кусок попадёт сюда.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">Куски</p>
      <Reorder.Group
        axis="y"
        values={chunks}
        onReorder={onReorder}
        className="flex flex-col gap-2"
      >
        {chunks.map((chunk, index) => (
          <Reorder.Item
            key={chunk.id}
            value={chunk}
            className="bg-muted/40 flex cursor-grab items-start gap-2 rounded-md border px-2 py-2 active:cursor-grabbing"
          >
            <GripVertical
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs">{index + 1}</p>
              <p className="text-sm whitespace-pre-wrap">
                {previewLyricHalf(chunk.text, 3)}
              </p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7 shrink-0"
              aria-label="Убрать кусок"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onRemove(chunk.id)}
            >
              <X className="size-3.5" />
            </Button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}
