'use client';

import { ApolloProvider } from '@apollo/client/react';
import type { ReactNode } from 'react';

import { apolloClient } from '@/shared/api';
import { PlaybackProvider } from '@/shared/lib/playback/playback-context';
import { ThemeProvider } from '@/shared/ui/shadcn/theme-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"
        disableTransitionOnChange
      >
        <PlaybackProvider>{children}</PlaybackProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}
