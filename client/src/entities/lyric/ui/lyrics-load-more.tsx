'use client';

import { useEffect, useRef } from 'react';

import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

export function LyricsLoadMore({
  hasMore,
  loadingMore,
  onVisible,
}: {
  hasMore: boolean;
  loadingMore: boolean;
  onVisible: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) {
      return;
    }

    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible();
        }
      },
      { root: node.closest('[data-lyrics-scroll]'), rootMargin: '160px' }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, onVisible]);

  if (!hasMore) {
    return null;
  }

  return (
    <div ref={ref} className="flex justify-center py-3">
      {loadingMore ? <Spinner className="size-5" /> : null}
    </div>
  );
}
