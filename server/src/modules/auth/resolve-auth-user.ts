import { env } from '~/config/env';
import { verifyTelegramWebAppUserId } from '~/config/telegram-webapp';
import {
  readSessionToken,
  sessionService,
  type SessionUser,
} from '~/modules/auth/session.service';
import { usersService } from '~/modules/users/users.service';

export type AuthUser = SessionUser;

export async function resolveAuthUser(
  request: Request
): Promise<AuthUser | null> {
  // Владелец сессии приходит join'ом в том же запросе — повторно его не читаем
  const sessionUser = await sessionService.resolveUser(
    readSessionToken(request)
  );
  if (sessionUser) {
    return sessionUser;
  }

  const initData = request.headers.get('x-telegram-init-data') ?? '';
  if (!initData || !env.BOT_TOKEN) {
    return null;
  }

  const telegramId = verifyTelegramWebAppUserId({
    initData,
    botToken: env.BOT_TOKEN,
    maxAgeSec: env.TELEGRAM_INIT_DATA_MAX_AGE_SEC,
  });

  if (telegramId === null) {
    return null;
  }

  let username: string | undefined;
  try {
    const params = new URLSearchParams(initData);
    const userRaw = params.get('user');
    if (userRaw) {
      const parsed: unknown = JSON.parse(userRaw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        'username' in parsed &&
        typeof parsed.username === 'string'
      ) {
        username = parsed.username;
      }
    }
  } catch {
    username = undefined;
  }

  const user = await usersService.findForLogin({ telegramId, username });
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
    username: user.username,
    telegramId: user.telegramId,
  };
}
