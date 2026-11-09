import { BotKeyboard, thtml } from '@mtcute/bun';
import {
  CallbackDataBuilder,
  CallbackQueryContext,
  filters,
  MessageContext,
} from '@mtcute/dispatcher';

import { invitesService } from '~/modules/users/invites.service';
import { catalogUrl } from '~/mtcute/catalog-url';
import { assertUser } from '~/mtcute/guards/assert-user';
import type { TypeBotClient } from '~/mtcute/types';

export const InviteButton = new CallbackDataBuilder('invite', 'action', 'id');

type CommandMessage = filters.Modify<MessageContext, { command: string[] }>;

const formatDate = (date: Date): string =>
  date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Moscow',
  });

let botUsername: string | null = null;

const resolveBotUsername = async (
  tg: TypeBotClient
): Promise<string | null> => {
  if (!botUsername) {
    const me = await tg.getMe();
    botUsername = me.username ?? null;
  }
  return botUsername;
};

const openCatalogKeyboard = () =>
  BotKeyboard.inline([[BotKeyboard.webView('Открыть каталог', catalogUrl())]]);

const sendInviteList = async (
  tg: TypeBotClient,
  chatId: number,
  userId: number
) => {
  const invites = await invitesService.listActive(userId);
  if (invites.length === 0) {
    await tg.sendText(chatId, 'Действующих приглашений нет. Новое — /invite');
    return;
  }

  const lines = invites.map(
    (invite, index) =>
      `${index + 1}. создано ${formatDate(invite.createdAt)}, действует до ${formatDate(invite.expiresAt)}`
  );

  await tg.sendText(
    chatId,
    `🎟 Действующие приглашения:\n\n${lines.join('\n')}`,
    {
      replyMarkup: BotKeyboard.inline(
        invites.map((invite, index) => [
          BotKeyboard.callback(
            `Отозвать ${index + 1}`,
            InviteButton.build({ action: 'revoke', id: String(invite.id) })
          ),
        ])
      ),
    }
  );
};

export const commandInvite = async ({
  tg,
  msg,
}: {
  tg: TypeBotClient;
  msg: CommandMessage;
}) => {
  const user = await assertUser({ tg, msg, permission: 'users:invite' });
  if (!user) {
    return;
  }

  const username = await resolveBotUsername(tg);
  if (!username) {
    await tg.sendText(msg.chat.id, '❌ Не удалось узнать имя бота');
    return;
  }

  const { code, expiresAt } = await invitesService.create(user.id);

  await tg.sendText(
    msg.chat.id,
    thtml`🎟 <b>Приглашение в каталог</b>

Отправь ссылку другу. Она сработает один раз, до ${formatDate(expiresAt)}:
https://t.me/${username}?start=inv_${code}

Отозвать — /invites`
  );
};

export const commandInvites = async ({
  tg,
  msg,
}: {
  tg: TypeBotClient;
  msg: CommandMessage;
}) => {
  const user = await assertUser({ tg, msg, permission: 'users:invite' });
  if (!user) {
    return;
  }

  await sendInviteList(tg, msg.chat.id, user.id);
};

export const handleInviteCallback = async ({
  tg,
  query,
}: {
  tg: TypeBotClient;
  query: CallbackQueryContext;
}): Promise<boolean> => {
  if (!query.data) {
    return false;
  }

  const data = InviteButton.parse(Buffer.from(query.data).toString());
  if (!data || data.action !== 'revoke') {
    return false;
  }

  const user = await assertUser({
    tg,
    msg: query as never,
    msgCallback: query,
    permission: 'users:invite',
  });
  if (!user) {
    await query.answer({});
    return true;
  }

  const revoked = await invitesService.revoke(Number(data.id), user.id);
  await query.answer({
    text: revoked ? 'Приглашение отозвано' : 'Уже недействительно',
  });
  await sendInviteList(tg, query.chat.id, user.id);
  return true;
};

export const handleInviteStart = async ({
  tg,
  msg,
}: {
  tg: TypeBotClient;
  msg: CommandMessage;
}) => {
  const code = msg.command[2] ?? '';
  const result = await invitesService.redeem({
    code,
    telegramId: msg.sender.id,
    username: msg.sender.username,
  });

  if (result.status === 'invalid') {
    await tg.sendText(
      msg.chat.id,
      'Приглашение недействительно: истекло, отозвано или уже использовано. Попросите у автора новую ссылку.'
    );
    return;
  }

  const text =
    result.status === 'created'
      ? '✅ Добро пожаловать! Каталог создан — пока пустой. Открой его кнопкой ниже.'
      : 'У тебя уже есть доступ к каталогу — открой его кнопкой ниже.';

  await tg.sendText(msg.chat.id, text, { replyMarkup: openCatalogKeyboard() });
};
