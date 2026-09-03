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
