import { thtml } from '@mtcute/bun';
import { filters, MessageContext } from '@mtcute/dispatcher';

import { prisma } from '~/infrastructure/prisma';
import { assertUser } from '~/mtcute/guards/assert-user';
import type { TypeBotClient } from '~/mtcute/types';

const HISTORY_WARNING =
  '⚠️ История канала не импортируется — в каталог попадут только новые посты после привязки.';

const helpText = () =>
  thtml`📺 <b>Привязка канала</b>

<code>/channel bind &lt;id&gt;</code> — привязать канал к каталогу
<code>/channel bind</code> — то же, если команда отправлена в канале
<code>/channel unbind [id]</code> — отвязать канал

Сначала добавьте бота в канал как администратора.
${HISTORY_WARNING}`;

const parseChannelIdArg = (raw: string | undefined): bigint | null => {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return null;
  }

  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
};

const channelIdFromChat = (msg: MessageContext): bigint | null => {
  const chat = msg.chat;
  if (chat.type !== 'chat') {
    return null;
  }

  if (chat.chatType !== 'channel' && chat.chatType !== 'supergroup') {
    return null;
  }

  return BigInt(chat.id);
};

const resolveBindChannelId = (
  msg: filters.Modify<MessageContext, { command: string[] }>,
  arg: string | undefined
): bigint | null => {
  const fromArg = parseChannelIdArg(arg);
  if (fromArg !== null) {
    return fromArg;
  }

  return channelIdFromChat(msg);
};

const isChannelAdminOrOwner = async ({
  tg,
  channelId,
  telegramUserId,
}: {
  tg: TypeBotClient;
  channelId: bigint;
  telegramUserId: bigint;
}): Promise<
  { ok: true; title: string | null } | { ok: false; reason: string }
> => {
  try {
    const member = await tg.getChatMember({
      chatId: Number(channelId),
      userId: Number(telegramUserId),
    });

    if (!member) {
      return {
        ok: false,
        reason:
          'Вы не участник этого канала, или бот не видит ваш статус. Добавьте бота в канал и попробуйте снова.',
      };
    }

    if (member.status !== 'creator' && member.status !== 'admin') {
      return {
        ok: false,
        reason: 'Привязать канал может только его владелец или администратор.',
      };
    }

    let title: string | null = null;
    try {
      const chat = await tg.getChat(Number(channelId));
      title = chat.title ?? null;
    } catch {
      title = null;
    }

    return { ok: true, title };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Не удалось проверить права в канале';
    console.error('MTCUTE: 🛑 channel bind getChatMember:', error);
    return {
      ok: false,
      reason: `Не удалось проверить права в канале: ${message}`,
    };
  }
};

export const commandChannel = async ({
  tg,
  msg,
}: {
  tg: TypeBotClient;
  msg: filters.Modify<MessageContext, { command: string[] }>;
}) => {
  const user = await assertUser({
    tg,
    msg,
    permission: 'channel:bind',
  });
  if (!user) {
    return;
  }

  if (user.telegramId === null) {
    await tg.sendText(msg.chat.id, 'Сначала откройте приложение');
    return;
  }

  const parts = msg.command
    .slice(1)
    .map((part) => part.trim())
    .filter(Boolean);
  const sub = (parts[0] ?? '').toLowerCase();
  const arg = parts[1];

  if (!sub || sub === 'help') {
    await tg.sendText(msg.chat.id, helpText());
    return;
  }

  if (sub === 'bind') {
    const channelId = resolveBindChannelId(msg, arg);
    if (channelId === null) {
      await tg.sendText(
        msg.chat.id,
        thtml`Укажите ID канала: <code>/channel bind &lt;id&gt;</code>
Или отправьте <code>/channel bind</code> прямо в канале.`
      );
      return;
    }

    const check = await isChannelAdminOrOwner({
      tg,
      channelId,
      telegramUserId: user.telegramId,
    });
    if (!check.ok) {
      await tg.sendText(msg.chat.id, `❌ ${check.reason}`);
      return;
    }

    const existing = await prisma.channelBinding.findUnique({
      where: { channelId },
    });
    if (existing && existing.userId !== user.id) {
      await tg.sendText(
        msg.chat.id,
        '❌ Этот канал уже привязан к другому каталогу.'
      );
      return;
    }

    const binding = await prisma.channelBinding.upsert({
      where: { channelId },
      create: {
        channelId,
        userId: user.id,
        title: check.title,
      },
      update: {
        userId: user.id,
        title: check.title,
      },
    });

    const titleLabel = binding.title ? ` «${binding.title}»` : '';
    await tg.sendText(
      msg.chat.id,
      thtml`✅ Канал${titleLabel} привязан (id <code>${channelId.toString()}</code>).

${HISTORY_WARNING}`
    );
    return;
  }

  if (sub === 'unbind') {
    const fromArg = parseChannelIdArg(arg);
    const fromChat = channelIdFromChat(msg);
    const channelId = fromArg ?? fromChat;

    if (channelId !== null) {
      const existing = await prisma.channelBinding.findUnique({
        where: { channelId },
      });
      if (!existing || existing.userId !== user.id) {
        await tg.sendText(
          msg.chat.id,
          '❌ Привязка этого канала к вашему каталогу не найдена.'
        );
        return;
      }

      await prisma.channelBinding.delete({ where: { channelId } });
      await tg.sendText(
        msg.chat.id,
        thtml`✅ Канал <code>${channelId.toString()}</code> отвязан. Новые посты больше не попадут в каталог.`
      );
      return;
    }

    const bindings = await prisma.channelBinding.findMany({
      where: { userId: user.id },
    });
    if (bindings.length === 0) {
      await tg.sendText(msg.chat.id, 'У вас нет привязанных каналов.');
      return;
    }

    if (bindings.length > 1) {
      const list = bindings
        .map((b) => {
          const title = b.title ? ` ${b.title}` : '';
          return `• <code>${b.channelId.toString()}</code>${title}`;
        })
        .join('\n');
      await tg.sendText(
        msg.chat.id,
        thtml`Укажите ID канала: <code>/channel unbind &lt;id&gt;</code>

Привязаны:
${list}`
      );
      return;
    }

    const only = bindings[0];
    if (!only) {
      await tg.sendText(msg.chat.id, 'У вас нет привязанных каналов.');
      return;
    }

    await prisma.channelBinding.delete({
      where: { channelId: only.channelId },
    });
    await tg.sendText(
      msg.chat.id,
      thtml`✅ Канал <code>${only.channelId.toString()}</code> отвязан. Новые посты больше не попадут в каталог.`
    );
    return;
  }

  await tg.sendText(msg.chat.id, helpText());
};
