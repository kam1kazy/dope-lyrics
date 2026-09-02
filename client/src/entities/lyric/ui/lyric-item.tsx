'use client';

import { Badge } from '@/shared/ui/shadcn/ui/badge';

import type { LyricSlide } from '../model/types';

interface LyricItemProps {
  item: LyricSlide;
}

export const LyricItem = ({ item }: LyricItemProps) => {
  return (
    <div className="flex max-w-[90%] flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {item.message?.hashtags ? (
          item.message.hashtags.tags.map((tag, index) => {
            return (
              <Badge
                variant="secondary"
                className="px-2.5 py-1 text-sm"
                key={tag + '_' + index}
              >
                #{tag}
              </Badge>
            );
          })
        ) : (
          <span className="text-muted-foreground text-base">Нет хештегов</span>
        )}
      </div>

      <p className="text-2xl leading-snug font-medium tracking-wide whitespace-pre-wrap sm:text-3xl">
        {item.message?.text}
      </p>
    </div>
  );
};
