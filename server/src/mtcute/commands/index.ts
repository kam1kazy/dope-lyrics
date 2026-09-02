import { BotKeyboard } from '@mtcute/core';
import {
  CallbackQueryContext,
  filters,
  MessageContext,
} from '@mtcute/dispatcher';

import { parseBotEnv } from '~/config/env';
import { lyricsService } from '~/modules/lyrics/lyrics.service';
import { getChatHistory } from '~/modules/lyrics/parse/get-chat-history';
import { assertAdmin } from '~/mtcute/guards/assert-admin';
import { sendToBotChat } from '~/mtcute/send';
import type { TypeBotClient } from '~/mtcute/types';

import seed from '../../../prisma/script/seed';

const botEnv = parseBotEnv();
const chatId = botEnv.BOT_CHAT_ID;
const channelId = botEnv.BOT_CHANNEL_ID;

interface ICommandChat {
  tg?: TypeBotClient | null;
  tgAdmin?: TypeBotClient | null;
  msg:
    | filters.Modify<MessageContext, { command: string[] }>
    | CallbackQueryContext;
  keyboard?: Parameters<typeof BotKeyboard.inline>[0];
}

const commandChatId = async ({ tg, msg }: ICommandChat) => {
  if (!tg) return;

  await assertAdmin({
    tg,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    action: async () => {
      const text = '💳 Chat ID: ' + msg.chat.id;
      sendToBotChat({ tg, chatId: msg.chat.id, text });
    },
  });
};

const commandStartApp = async ({ tg, msg }: ICommandChat) => {
  if (!tg) return;
  await assertAdmin({
    tg,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    action: async () => {
      const text = '📱 Вы хотите открыть приложение?';
      await tg.sendText(msg.chat.id, text, {
        replyMarkup: BotKeyboard.inline([
          [BotKeyboard.url('Запустить', `https://${botEnv.SITE_URL}/`)],
        ]),
      });
    },
  });
};

const commandStartBd = async ({ tg, msg, keyboard }: ICommandChat) => {
  if (!tg) return;
  await assertAdmin({
    tg,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    action: async () => {
      const text = '⚡️ Управление базой данных';
      await tg.sendText(msg.chat.id, text, {
        replyMarkup: BotKeyboard.inline(keyboard ?? []),
      });
    },
  });
};

const commandChatHistory = async ({ tgAdmin, msg }: ICommandChat) => {
  if (!tgAdmin) return;
  await assertAdmin({
    tg: tgAdmin,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    action: async () => {
      await getChatHistory({ tg: tgAdmin, chatId: channelId });
    },
  });
};

const seedToDb = async ({ tgAdmin, msg }: ICommandChat) => {
  if (!tgAdmin) return;

  await assertAdmin({
    tg: tgAdmin,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    msgCallback: msg as CallbackQueryContext,
    action: async () => {
      sendToBotChat({
        tg: tgAdmin,
        chatId,
        text: '🌱 Начался посев...',
      });

      await seed();
    },
  });
};

const clearDb = async ({ tgAdmin, msg }: ICommandChat) => {
  if (!tgAdmin) return;
  await assertAdmin({
    tg: tgAdmin,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    msgCallback: msg as CallbackQueryContext,
    action: async () => {
      sendToBotChat({
        tg: tgAdmin,
        chatId,
        text: '🧹 Началась очистка базы...',
      });
      await lyricsService.clearCatalog();
    },
  });
};

const getStats = async ({ tgAdmin, msg }: ICommandChat) => {
  if (!tgAdmin) return;
  await assertAdmin({
    tg: tgAdmin,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    action: async () => {
      const stats = await lyricsService.getStats();

      sendToBotChat({
        tg: tgAdmin,
        chatId,
        text: `📊 Статистика: \n\nUsers: ${stats?.users} \nLyrics: ${stats?.lyrics}`,
      });
    },
  });
};

export {
  clearDb,
  commandChatHistory,
  commandChatId,
  commandStartApp,
  commandStartBd,
  getStats,
  seedToDb,
};
