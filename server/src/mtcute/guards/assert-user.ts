import {
  CallbackQueryContext,
  filters,
  MessageContext,
} from '@mtcute/dispatcher';

import { parseBotEnv } from '~/config/env';
import type { Users } from '~/generated/prisma/client';
import { can, type Permission } from '~/modules/auth/permissions';
import { usersService } from '~/modules/users/users.service';
import { resolveSenderTelegramId } from '~/mtcute/guards/assert-admin';
import type { TypeBotClient } from '~/mtcute/types';

const botEnv = parseBotEnv();
const fallbackChatId = botEnv.BOT_CHAT_ID;

type MessageLike =
  MessageContext | filters.Modify<MessageContext, { command: string[] }>;

interface AssertUserArgs {
  tg: TypeBotClient;
  msg: MessageLike;
  msgCallback?: CallbackQueryContext;
  /** Если задано — дополнительно проверяет `can(user, permission)`. */
  permission?: Permission;
}

const replyChatId = (msg: MessageLike, msgCallback?: CallbackQueryContext) => {
  const fromCallback = msgCallback?.chat?.id;
  if (typeof fromCallback === 'number' && Number.isFinite(fromCallback)) {
    return fromCallback;
  }

  const fromMsg = msg.chat?.id;
  if (typeof fromMsg === 'number' && Number.isFinite(fromMsg)) {
    return fromMsg;
  }

  return fallbackChatId;
};

/**
 * Находит учётку по Telegram id отправителя.
 * Если учётки нет — отвечает «Доступ по приглашению…» и возвращает null.
 */
export const assertUser = async ({
  tg,
  msg,
  msgCallback,
  permission,
}: AssertUserArgs): Promise<Users | null> => {
  const telegramId = resolveSenderTelegramId({ msg, msgCallback });
  const chatId = replyChatId(msg, msgCallback);

  if (telegramId === null) {
    await tg.sendText(
      chatId,
      'Доступ по приглашению — попросите ссылку у автора каталога'
    );
    return null;
  }

  const user = await usersService.findByTelegramId(telegramId);
  if (!user) {
    await tg.sendText(
      chatId,
      'Доступ по приглашению — попросите ссылку у автора каталога'
    );
    return null;
  }

  if (permission !== undefined && !can(user, permission)) {
    await tg.sendText(chatId, '🛑 Вы не имеете доступ к этой команде');
    return null;
  }

  return user;
};
