// TELEGRAM BOT
import { TelegramClient } from '@mtcute/bun'
import { Dispatcher, filters } from '@mtcute/dispatcher'

// HANDLERS
import { commandChatHistory, commandChatId } from './commands'

// КОНСТАНТЫ
import * as env from '../env'

const phone = env.BOT_PHONE
const pass = env.BOT_PASS

// Создаем клиент
export const tg = new TelegramClient({
  apiId: env.API_ID,
  apiHash: env.API_HASH,
  storage: './bot-data/session',
})

export type TypeBotClient = typeof tg

// Диспетчер событий
const dp = Dispatcher.for(tg)

export type TypeBotDispatcher = typeof dp

// Авторизуемся в боте
const self = await tg
  .start({
    phone: phone,
    code: async () => {
      const code = await prompt('MTCUTE: 🙈 Введите код:')
      if (code === null) {
        throw new Error('MTCUTE: ❌ Отменено пользователем\n\n')
      }
      return code
    },
    password: pass,
  })
  .then((self) => {
    console.log('\nMTCUTE: 🤖 Вошел в систему как -', self.username)
  })
  .catch((error) => {
    console.error('\nMTCUTE: 🛑 Не вошел в систему\n\n', error)
  })

// Команды для бота

// Получаем историю чата
dp.onNewMessage(filters.command('chathistory'), async (msg) =>
  commandChatHistory({ tg, msg })
)
// Получаем ID чата
dp.onNewMessage(filters.command('chatid'), async (msg) =>
  commandChatId({ tg, msg })
)
