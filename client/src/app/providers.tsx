'use client';

import { ApolloProvider } from '@apollo/client/react';
import type { ReactNode } from 'react';

import { apolloClient } from '@/shared/api';
import { LyricViewProvider } from '@/shared/lib/lyric-view/lyric-view-context';
import { PlaybackProvider } from '@/shared/lib/playback/playback-context';
import { ThemeProvider } from '@/shared/ui/shadcn/theme-provider';
import { TooltipProvider } from '@/shared/ui/shadcn/ui/tooltip';

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
            <PlaybackProvider>{children}</PlaybackProvider>
          </LyricViewProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}
