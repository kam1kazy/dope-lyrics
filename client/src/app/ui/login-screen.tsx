'use client';

import { useEffect, useRef, useState } from 'react';

import {
  loginWithTelegramWidget,
  type TelegramLoginPayload,
} from '@/shared/api';
import { Button } from '@/shared/ui/shadcn/ui/button';

const botUsername =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, '') ?? '';

declare global {
  interface Window {
    onDopeLyricsTelegramAuth?: (user: TelegramLoginPayload) => void;
  }
}

type LoginScreenProps = {
  onSuccess: () => void;
};

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const widgetHostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    if (!botUsername || !widgetHostRef.current) {
      return;
    }

    const host = widgetHostRef.current;
    host.replaceChildren();

    window.onDopeLyricsTelegramAuth = (user) => {
      void (async () => {
        setPending(true);
        setError(null);

        const result = await loginWithTelegramWidget({
          id: Number(user.id),
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          photo_url: user.photo_url,
          auth_date: Number(user.auth_date),
          hash: String(user.hash),
        });

        setPending(false);

        if (!result.ok) {
          setError(result.error);
          return;
        }

        onSuccess();
      })();
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onDopeLyricsTelegramAuth(user)');
    host.appendChild(script);

    return () => {
      delete window.onDopeLyricsTelegramAuth;
      host.replaceChildren();
    };
  }, [onSuccess]);

  return (
    <div className="lyric-app bg-background text-foreground flex h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-lg font-medium tracking-wide">DOPE LYRICS</h1>
        <p className="text-muted-foreground text-sm">
          Войдите через Telegram, чтобы открыть свой каталог
        </p>

        {botUsername ? (
          <div
            ref={widgetHostRef}
            className="flex min-h-10 items-center justify-center"
            aria-busy={pending}
          />
        ) : (
          <div className="flex w-full flex-col items-center gap-3">
            <p className="text-muted-foreground text-sm">
              Пока откройте каталог из Telegram Mini App — вход из браузера
              подключится после настройки бота.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setHintOpen((open) => !open);
              }}
            >
              Как открыть из Telegram
            </Button>
            {hintOpen ? (
              <p className="text-muted-foreground text-xs leading-relaxed">
                Найдите бота в Telegram и откройте мини-приложение каталога.
                После входа сессия сохранится, и каталог можно будет ставить на
                домашний экран.
              </p>
            ) : null}
          </div>
        )}

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        {pending ? (
          <p className="text-muted-foreground text-xs">Входим…</p>
        ) : null}
      </div>
    </div>
  );
}
