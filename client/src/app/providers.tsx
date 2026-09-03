'use client';

import { ApolloProvider } from '@apollo/client/react';
import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { apolloClient } from '@/shared/api';
import { LyricViewProvider } from '@/shared/lib/lyric-view/lyric-view-context';
import { PlaybackProvider } from '@/shared/lib/playback/playback-context';
import { ThemeProvider } from '@/shared/ui/shadcn/theme-provider';
import { Toaster } from '@/shared/ui/shadcn/ui/sonner';
import { TooltipProvider } from '@/shared/ui/shadcn/ui/tooltip';

function BodyToaster() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.body);
  }, []);

  if (target === null) {
    return null;
  }

  return createPortal(<Toaster />, target);
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <LyricViewProvider>
            <PlaybackProvider>
              {children}
              <BodyToaster />
            </PlaybackProvider>
          </LyricViewProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}
