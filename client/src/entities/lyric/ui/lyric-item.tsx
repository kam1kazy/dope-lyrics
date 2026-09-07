'use client';

import { Heart } from 'lucide-react';

import { useLyricView } from '@/shared/lib/lyric-view/lyric-view-context';
import { cn } from '@/shared/lib/utils/cn';
import { Badge } from '@/shared/ui/shadcn/ui/badge';

import type { LyricSlide } from '../model/types';

interface LyricItemProps {
  item: LyricSlide;
  liked?: boolean;
  flashLike?: boolean;
}

export const LyricItem = ({
  item,
  liked = false,
  flashLike = false,
}: LyricItemProps) => {
  const { fontSize, lineHeight } = useLyricView();
  const tags = item.message?.hashtags?.tags ?? [];
  const reactionEmojis = (item.message?.reactions?.emojis ?? [])
    .map((entry) => entry.emoji)
    .filter((emoji): emoji is string => Boolean(emoji));
  const used = item.isUsed === true;

  return (
    <div
      className={cn(
        'pointer-events-auto flex max-w-[90%] flex-col items-center gap-4 transition-colors',
        used && 'rounded-xl bg-amber-500/10 px-3 py-2 ring-1 ring-amber-400/40'
      )}
      data-lyric-hit
    >
      {liked || flashLike ? (
        <div
          className={cn(
            'flex items-center gap-1 text-rose-400 transition-opacity',
            flashLike && 'animate-pulse'
          )}
          aria-label={liked ? 'лайкнуто' : 'лайк'}
        >
          <Heart
            className={cn(
              'size-5',
              (liked || flashLike) && 'fill-rose-400 text-rose-400'
            )}
            aria-hidden
          />
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {tags.map((tag, index) => (
            <Badge
              variant="secondary"
              className="px-2.5 py-1 text-sm"
              key={tag + '_' + index}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {reactionEmojis.length > 0 ? (
        <div
          className="text-muted-foreground flex flex-wrap items-center justify-center gap-1.5 text-lg"
          aria-label="Реакции"
        >
          {reactionEmojis.map((emoji, index) => (
            <span key={`${emoji}_${index}`}>{emoji}</span>
          ))}
        </div>
      ) : null}

      <p
        className={cn(
          'font-medium tracking-wide whitespace-pre-wrap',
          used && 'text-amber-100'
        )}
        style={{ fontSize: `${fontSize}px`, lineHeight }}
      >
        {item.message?.text}
      </p>
    </div>
  );
};
