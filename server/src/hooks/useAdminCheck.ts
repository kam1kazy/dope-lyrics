import {
  CallbackQueryContext,
  filters,
  MessageContext,
} from '@mtcute/dispatcher';

import * as env from '~/env';
import { TypeBotClient } from '~/mtcute/index';

const chatId = env.BOT_CHAT_ID;
const botAdminId = Number(env.BOT_ADMIN_ID);

interface IAdminCheck {
  tg: TypeBotClient;
  msg: filters.Modify<MessageContext, { command: string[] }>;
  msgCallback?: CallbackQueryContext;
  action: () => Promise<void>;
}

export const useAdminCheck = async ({
  tg,
  msg,
  msgCallback,
  action,
}: IAdminCheck) => {
  if (!msgCallback) {
    await msg.delete().catch(() => undefined);
  }

  const senderId = Number(msg.sender?.id);
  const callbackUserId = Number(msgCallback?.user?.id);
  const chatIdFromMsg = Number(msg.chat?.id);
  const postedAsChat =
    !msgCallback && msg.sender?.type === 'chat' && senderId === chatIdFromMsg;

  if (
    senderId === botAdminId ||
    callbackUserId === botAdminId ||
    postedAsChat
  ) {
    await action();
    return;
  }

  const seenId = msgCallback ? callbackUserId : senderId;
  console.log(
    Number.isNaN(botAdminId)
      ? `MTCUTE: 🛑 Нет доступа: BOT_ADMIN_ID в .env должен быть числовым Telegram user id, не username. Ваш id: ${seenId}`
      : `MTCUTE: 🛑 Нет доступа: отправитель ${seenId}, в BOT_ADMIN_ID указан другой. В канале пост идёт от имени чата, не от user id.`
  );
  await tg.sendText(chatId, 'MTCUTE: 🛑 Вы не имеете доступ к этой команде');
};
