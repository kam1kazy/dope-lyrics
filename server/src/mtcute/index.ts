// TELEGRAM BOT
import { BotKeyboard, TelegramClient } from '@mtcute/bun';
import { CallbackDataBuilder, Dispatcher, filters } from '@mtcute/dispatcher';
import fs from 'fs';
import path from 'path';

import { getChatHistory } from '~/handlers/getChatHistory';
import { sendToBotChat } from '~/handlers/handlers';
import { useAdminCheck } from '~/hooks/useAdminCheck';
import { prismaService } from '~/services/db';

// КОНСТАНТЫ
import * as env from '../env';
// HANDLERS
import {
  clearBD,
  commandChatId,
  commandStartApp,
  commandStartBd,
  seedToBD,
} from './commands';

const phone = env.BOT_PHONE;
const pass = env.BOT_PASS;
const botToken = env.BOT_TOKEN;
const botType = env.BOT_TYPE;
const channelId = env.BOT_CHANNEL_ID;

const botSessionPath = path.resolve(__dirname, '../../bot-data/session');
const adminSessionPath = path.resolve(
  __dirname,
  '../../bot-data/sessionAdmin/session'
);

fs.mkdirSync(path.dirname(botSessionPath), { recursive: true });
fs.mkdirSync(path.dirname(adminSessionPath), { recursive: true });

// Создаем и инициализируем основного бота
export const tg = new TelegramClient({
  apiId: env.API_ID,
  apiHash: env.API_HASH,
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

// Диспетчер событий
export type TypeBotClient = typeof tg;

const dp = Dispatcher.for(tg);
export type TypeBotDispatcher = typeof dp;

// Создаем и инициализируем админ-клиент
export let tgAdmin: TelegramClient | null = null;

if (botType === 'admin') {
  tgAdmin = new TelegramClient({
    apiId: env.API_ID,
    apiHash: env.API_HASH,
    storage: adminSessionPath,
  });

  // Добавляем инициализацию tgAdmin
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

// Получаем ID чата
dp.onNewMessage(filters.command('chatid'), async (msg) =>
  commandChatId({ tg, msg })
);
// Открываем приложение
dp.onNewMessage(filters.command('app'), async (msg) =>
  commandStartApp({ tg, msg })
);

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

// Управление базой данных
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

  await useAdminCheck({
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
          const stats = await prismaService.getStats();
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
          await seedToBD({ tgAdmin, msg: query }).then(() => {
            sendToBotChat({
              tg,
              chatId,
              text: '✅ Посев завершен',
            });
          });
          break;

        case 'clear':
          await query.answer({ text: '⏳ Началась очистка...' });
          await clearBD({ tgAdmin, msg: query });
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
