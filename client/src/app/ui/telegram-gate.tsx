'use client';

import { type ReactNode, useEffect, useState } from 'react';

import {
  getTelegramInitData,
  prepareTelegramWebApp,
} from '@/shared/lib/telegram-webapp';

const isProductionBuild = process.env.NODE_ENV === 'production';

export function TelegramGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isProductionBuild);
  const [allowed, setAllowed] = useState(!isProductionBuild);

  useEffect(() => {
    prepareTelegramWebApp();

    if (!isProductionBuild) {
      return;
    }

    setAllowed(Boolean(getTelegramInitData()));
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  if (!allowed) {
    return (
      <div className="lyric-app bg-background text-foreground flex h-svh items-center justify-center p-6 text-center">
        <p>Откройте каталог из Telegram</p>
      </div>
    );
  }

  return children;
}
