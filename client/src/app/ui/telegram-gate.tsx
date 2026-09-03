'use client';

import { type ReactNode, useEffect, useState } from 'react';

import {
  prepareTelegramWebApp,
  whenTelegramWebAppReady,
} from '@/shared/lib/telegram-webapp';

const isProductionBuild = process.env.NODE_ENV === 'production';

export function TelegramGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isProductionBuild);
  const [allowed, setAllowed] = useState(!isProductionBuild);

  useEffect(() => {
    if (!isProductionBuild) {
      return;
    }

    let cancelled = false;

    void whenTelegramWebAppReady().then((webApp) => {
      if (cancelled) {
        return;
      }

      if (webApp) {
        prepareTelegramWebApp();
      }

      setAllowed(Boolean(webApp?.initData));
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
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
