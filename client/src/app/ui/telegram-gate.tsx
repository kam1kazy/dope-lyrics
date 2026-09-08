'use client';

import { type ReactNode, useCallback, useEffect, useState } from 'react';

import {
  AUTH_SIGNED_OUT_EVENT,
  clearExplicitLogout,
  fetchAuthMe,
  hasExplicitLogout,
  loginWithTelegramWebApp,
} from '@/shared/api';
import { reloadIfStaleDeploy } from '@/shared/lib/deploy-at';
import {
  prepareTelegramWebApp,
  whenTelegramWebAppReady,
} from '@/shared/lib/telegram-webapp';

import { LoginScreen } from './login-screen';

const isProductionBuild = process.env.NODE_ENV === 'production';

export function TelegramGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isProductionBuild);
  const [allowed, setAllowed] = useState(!isProductionBuild);

  const allow = useCallback(() => {
    clearExplicitLogout();
    setAllowed(true);
    setReady(true);
  }, []);

  useEffect(() => {
    const onSignedOut = () => {
      setAllowed(false);
      setReady(true);
    };

    window.addEventListener(AUTH_SIGNED_OUT_EVENT, onSignedOut);

    return () => {
      window.removeEventListener(AUTH_SIGNED_OUT_EVENT, onSignedOut);
    };
  }, []);

  useEffect(() => {
    if (!isProductionBuild) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const reloading = await reloadIfStaleDeploy();
      if (reloading || cancelled) {
        return;
      }

      if (hasExplicitLogout()) {
        setAllowed(false);
        setReady(true);
        return;
      }

      try {
        const sessionUser = await fetchAuthMe();
        if (cancelled) {
          return;
        }

        if (sessionUser) {
          setAllowed(true);
          setReady(true);
          return;
        }
      } catch {
        // continue to Mini App / login
      }

      const webApp = await whenTelegramWebAppReady();
      if (cancelled) {
        return;
      }

      if (webApp?.initData) {
        prepareTelegramWebApp();

        const result = await loginWithTelegramWebApp(webApp.initData);
        if (cancelled) {
          return;
        }

        if (result.ok) {
          setAllowed(true);
          setReady(true);
          return;
        }
      }

      setAllowed(false);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }

  if (!allowed) {
    return <LoginScreen onSuccess={allow} />;
  }

  return children;
}
