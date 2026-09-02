'use client';

import { ControlBar } from '@/widgets/control-bar';
import { LyricList } from '@/widgets/lyric-list';

import { Providers } from './providers';
import { AppShell } from './ui/app-shell';

export default function Home() {
  return (
    <Providers>
      <AppShell>
        <LyricList />
      </AppShell>
      <ControlBar />
    </Providers>
  );
}
