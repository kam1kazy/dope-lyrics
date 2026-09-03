type TelegramWebApp = {
  initData: string;
  ready: () => void;
  expand: () => void;
};

type TelegramNamespace = {
  WebApp?: TelegramWebApp;
};

const telegramWindow = ():
  (Window & { Telegram?: TelegramNamespace }) | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window;
};

export const getTelegramWebApp = (): TelegramWebApp | null => {
  return telegramWindow()?.Telegram?.WebApp ?? null;
};

export const getTelegramInitData = (): string => {
  return getTelegramWebApp()?.initData ?? '';
};

export const prepareTelegramWebApp = (): void => {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    return;
  }

  webApp.ready();
  webApp.expand();
};

const TELEGRAM_WAIT_MS = 2500;
const TELEGRAM_POLL_MS = 50;

export function whenTelegramWebAppReady(): Promise<TelegramWebApp | null> {
  const existing = getTelegramWebApp();

  if (existing) {
    return Promise.resolve(existing);
  }

  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const deadline = Date.now() + TELEGRAM_WAIT_MS;

    const tick = () => {
      const webApp = getTelegramWebApp();

      if (webApp) {
        resolve(webApp);
        return;
      }

      if (Date.now() >= deadline) {
        resolve(null);
        return;
      }

      window.setTimeout(tick, TELEGRAM_POLL_MS);
    };

    tick();
  });
}
