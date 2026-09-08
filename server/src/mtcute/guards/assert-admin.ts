import {
  CallbackQueryContext,
  filters,
  MessageContext,
} from '@mtcute/dispatcher';

import { parseBotEnv } from '~/config/env';
import { prisma } from '~/infrastructure/prisma';
import { can, type Permission } from '~/modules/auth/permissions';
import type { TypeBotClient } from '~/mtcute/types';

const botEnv = parseBotEnv();
const chatId = botEnv.BOT_CHAT_ID;
const botAdminId = Number(botEnv.BOT_ADMIN_ID);

interface AssertPermission {
  tg: TypeBotClient;
  msg: filters.Modify<MessageContext, { command: string[] }> | MessageContext;
  msgCallback?: CallbackQueryContext;
  permission: Permission;
  action: () => Promise<void>;
}

export const resolveSenderTelegramId = ({
  msg,
  msgCallback,
}: {
  msg: MessageContext | filters.Modify<MessageContext, { command: string[] }>;
  msgCallback?: CallbackQueryContext;
}): number | null => {
  const senderId = Number(msg.sender?.id);
  const callbackUserId = Number(msgCallback?.user?.id);
  const chatIdFromMsg = Number(msg.chat?.id);
  const postedAsChat =
    !msgCallback && msg.sender?.type === 'chat' && senderId === chatIdFromMsg;

  if (msgCallback && Number.isFinite(callbackUserId) && callbackUserId > 0) {
    return callbackUserId;
  }

  if (postedAsChat && Number.isFinite(botAdminId) && botAdminId > 0) {
    return botAdminId;
  }

  if (Number.isFinite(senderId) && senderId > 0) {
    return senderId;
  }

  return null;
};

export const assertPermission = async ({
  tg,
  msg,
  msgCallback,
  permission,
  action,
}: AssertPermission) => {
  if (!msgCallback) {
    await msg.delete().catch(() => undefined);
  }

  const telegramId = resolveSenderTelegramId({ msg, msgCallback });
  if (telegramId === null) {
    console.log('MTCUTE: 🛑 Нет доступа: не удалось определить отправителя');
    await tg.sendText(chatId, 'MTCUTE: 🛑 Вы не имеете доступ к этой команде');
    return;
  }

  const user = await prisma.users.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { id: true, role: true },
  });

  if (!can(user, permission)) {
    console.log(
      `MTCUTE: 🛑 Нет доступа: telegramId=${telegramId}, role=${user?.role ?? 'нет'}, нужно ${permission}`
    );
    await tg.sendText(chatId, 'MTCUTE: 🛑 Вы не имеете доступ к этой команде');
    return;
  }

  await action();
};

/** @deprecated Используйте assertPermission с явным правом. */
export const assertAdmin = async (
  args: Omit<AssertPermission, 'permission'> & { permission?: Permission }
) => {
  await assertPermission({
    ...args,
    permission: args.permission ?? 'db:seed',
  });
};
