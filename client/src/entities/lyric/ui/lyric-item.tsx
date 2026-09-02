'use client';

import { Badge } from '@/shared/ui/shadcn/ui/badge';

import type { LyricSlide } from '../model/types';

interface LyricItemProps {
  item: LyricSlide;
}

export const LyricItem = ({ item }: LyricItemProps) => {
  const tags = item.message?.hashtags?.tags ?? [];

  return (
    <div className="flex max-w-[90%] flex-col items-center gap-4">
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

      <p className="text-2xl leading-snug font-medium tracking-wide whitespace-pre-wrap sm:text-3xl">
        {item.message?.text}
      </p>
    </div>
  );
};
