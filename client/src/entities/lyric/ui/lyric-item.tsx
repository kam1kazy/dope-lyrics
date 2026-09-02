'use client';

import { useLyricView } from '@/shared/lib/lyric-view/lyric-view-context';
import { Badge } from '@/shared/ui/shadcn/ui/badge';

import type { LyricSlide } from '../model/types';

interface LyricItemProps {
  item: LyricSlide;
}

export const LyricItem = ({ item }: LyricItemProps) => {
  const { fontSize, lineHeight } = useLyricView();
  const tags = item.message?.hashtags?.tags ?? [];
  const reactionEmojis = (item.message?.reactions?.emojis ?? [])
    .map((entry) => entry.emoji)
    .filter((emoji): emoji is string => Boolean(emoji));

  return (
    <div
      className="pointer-events-auto flex max-w-[90%] flex-col items-center gap-4"
      data-lyric-hit
    >
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
        className="font-medium tracking-wide whitespace-pre-wrap"
        style={{ fontSize: `${fontSize}px`, lineHeight }}
      >
        {item.message?.text}
      </p>
    </div>
  );
};
