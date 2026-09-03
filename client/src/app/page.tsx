'use client';

import { CatalogMenu } from '@/widgets/catalog-menu';
import { ControlBar } from '@/widgets/control-bar';
import { LyricList } from '@/widgets/lyric-list';

import { Providers } from './providers';
import { AppShell } from './ui/app-shell';
import { TelegramGate } from './ui/telegram-gate';

export default function Home() {
  return (
    <TelegramGate>
      <Providers>
        <AppShell>
          <LyricList />
        </AppShell>
        <CatalogMenu />
        <ControlBar />
      </Providers>
    </TelegramGate>
  );
}
