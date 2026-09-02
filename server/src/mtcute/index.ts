import { BotKeyboard, TelegramClient } from '@mtcute/bun';
import { CallbackDataBuilder, Dispatcher, filters } from '@mtcute/dispatcher';
import fs from 'fs';
import path from 'path';

import { parseBotEnv } from '~/config/env';
import { lyricsService } from '~/modules/lyrics/lyrics.service';
import { getChatHistory } from '~/modules/lyrics/parse/get-chat-history';
import {
  clearDb,
  commandChatId,
  commandStartApp,
  commandStartBd,
  seedToDb,
} from '~/mtcute/commands';
import { assertAdmin } from '~/mtcute/guards/assert-admin';
import { startIngestHttp } from '~/mtcute/ingest-http';
import { sendToBotChat } from '~/mtcute/send';

const botEnv = parseBotEnv();

const phone = botEnv.BOT_PHONE;
const pass = botEnv.BOT_PASS;
const botToken = botEnv.BOT_TOKEN;
const botType = botEnv.BOT_TYPE;
const channelId = botEnv.BOT_CHANNEL_ID;

const botSessionPath = path.resolve(__dirname, '../../bot-data/session');
const adminSessionPath = path.resolve(
  __dirname,
  '../../bot-data/sessionAdmin/session'
);

fs.mkdirSync(path.dirname(botSessionPath), { recursive: true });
fs.mkdirSync(path.dirname(adminSessionPath), { recursive: true });

export const tg = new TelegramClient({
  apiId: botEnv.API_ID,
  apiHash: botEnv.API_HASH,
  storage: botSessionPath,
});

await tg
  .start({
    botToken,
  })
  .then(() => {
    console.log('MTCUTE: 🤖 Бот запущен');
  })
  .catch((error) => {
    console.error('MTCUTE: ❌ Ошибка при запуске бота:', error);
  });

export type TypeBotClient = typeof tg;

const dp = Dispatcher.for(tg);

const BdButton = new CallbackDataBuilder('bd', 'id', 'action');

const markup = [
  [
    BotKeyboard.callback(
      '🏄‍♂️ Статистика',
      BdButton.build({ id: '1', action: 'stats' })
    ),
    BotKeyboard.callback(
      '🏄‍♂️ Парсинг чата',
      BdButton.build({ id: '2', action: 'history' })
    ),
  ],
  [
    BotKeyboard.callback(
      '🏄‍♂️ Посев',
      BdButton.build({ id: '3', action: 'seed' })
    ),
    BotKeyboard.callback(
      '🏄‍♂️ Очистка',
      BdButton.build({ id: '4', action: 'clear' })
    ),
  ],
];

export let tgAdmin: TelegramClient | null = null;

if (botType === 'admin') {
  tgAdmin = new TelegramClient({
    apiId: botEnv.API_ID,
    apiHash: botEnv.API_HASH,
    storage: adminSessionPath,
  });

  await tgAdmin.start({
    phone,
    code: async () => {
      const code = await prompt('MTCUTE: 🙈 Введите код для админа:');
      if (code === null) {
        throw new Error('MTCUTE: ❌ Отменено пользователем\n\n');
      }
      return code;
    },
    password: pass,
  });
  console.log('MTCUTE: 🤖 Админ вошел в систему');
}

startIngestHttp({
  tgAdmin,
  channelId,
  port: botEnv.INGEST_PORT,
});

dp.onNewMessage(filters.command('chatid'), async (msg) =>
  commandChatId({ tg, msg })
);

dp.onNewMessage(filters.command('app'), async (msg) =>
  commandStartApp({ tg, msg })
);

dp.onNewMessage(filters.command('bd'), async (msg) =>
  commandStartBd({ tg, msg, keyboard: markup })
);

dp.onCallbackQuery(async (query) => {
  if (!query.data) {
    return;
  }
  const data = BdButton.parse(Buffer.from(query.data).toString());
  if (!data) {
    return;
  }

  const action = data.action;
  const chatId = query.chat.id;

  if (!chatId) {
    await query.answer({ text: '❌ Ошибка: чат не найден', alert: true });
    return;
  }

  await assertAdmin({
    tg,
    msg: query as never,
    msgCallback: query,
    action: async () => {
      if (!tgAdmin) {
        await query.answer({
          text: '❌ Ошибка: админ не авторизован',
          alert: true,
        });
        return;
      }

      switch (action) {
        case 'stats': {
          await query.answer({ text: '⏳ Получение статистики...' });
          const stats = await lyricsService.getStats();
          if (stats) {
            sendToBotChat({
              tg,
              chatId,
              text: `📊 Статистика:\n\nUsers: ${stats.users}\nLyrics: ${stats.lyrics}`,
            });
          }
          break;
        }

        case 'history': {
          await query.answer({ text: '⏳ Получение истории...' });
          sendToBotChat({
            tg,
            chatId,
            text: '🔍 Получение истории чата...',
          });
          const success = await getChatHistory({
            tg: tgAdmin,
            chatId: channelId,
          });
          if (success) {
            sendToBotChat({
              tg,
              chatId,
              text: '📥 История чата получена',
            });
          }
          break;
        }

        case 'seed':
          await query.answer({ text: '⏳ Начался посев...' });
          await seedToDb({ tgAdmin, msg: query }).then(() => {
            sendToBotChat({
              tg,
              chatId,
              text: '✅ Посев завершен',
            });
          });
          break;

        case 'clear':
          await query.answer({ text: '⏳ Началась очистка...' });
          await clearDb({ tgAdmin, msg: query });
          sendToBotChat({
            tg,
            chatId,
            text: '🧹 Очистка завершена',
          });
          break;

        default:
          await query.answer({
            text: '❌ Неизвестная команда',
            alert: true,
          });
      }
    },
  });
});
