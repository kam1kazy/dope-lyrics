'use client';

import { Badge } from '@/shared/ui/shadcn/ui/badge';

import type { LyricSlide } from '../model/types';

interface LyricItemProps {
  item: LyricSlide;
}

export const LyricItem = ({ item }: LyricItemProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {item.message?.hashtags
          ? item.message.hashtags.tags.map((tag, index) => {
              return (
                <Badge variant="secondary" key={tag + '_' + index}>
                  #{tag}
                </Badge>
              );
            })
          : 'Нет хештегов'}
      </div>

      <p className="whitespace-pre-wrap">{item.message?.text}</p>
    </div>
  );
};
