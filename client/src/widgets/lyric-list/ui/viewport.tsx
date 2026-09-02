'use client';

import { useEffect, useState } from 'react';

import { LyricItem, type LyricSlide } from '@/entities/lyric';
import { usePlayback } from '@/shared/lib/playback/playback-context';
import { cn } from '@/shared/lib/utils/cn';

interface ViewportProps {
  data: LyricSlide[];
}

export function Viewport({ data }: ViewportProps) {
  const { paused } = usePlayback();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (paused) {
      return;
    }

    const intervalId = setInterval(() => {
      setIndex((prevIndex) => {
        if (prevIndex + 1 >= data.length) {
          return prevIndex;
        }

        return prevIndex + 1;
      });
    }, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [data.length, paused]);

  return (
    <div
      className="lyric-viewport relative min-h-0 w-full flex-1 overflow-hidden"
      data-paused={paused}
    >
      {data.slice(0, index + 1).map((item) => (
        <div
          key={item.lyric_id + '_' + item.message?.message_id}
          className="lyric"
        >
          <LyricItem item={item} />
        </div>
      ))}

      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-background to-transparent transition-all duration-300',
          paused ? 'h-36 opacity-100' : 'h-10 opacity-50'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background to-transparent transition-all duration-300',
          paused ? 'h-36 opacity-100' : 'h-10 opacity-50'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 z-10 bg-gradient-to-r from-background to-transparent transition-all duration-300',
          paused ? 'w-16 opacity-100' : 'w-6 opacity-40'
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 z-10 bg-gradient-to-l from-background to-transparent transition-all duration-300',
          paused ? 'w-16 opacity-100' : 'w-6 opacity-40'
        )}
      />
    </div>
  );
}
