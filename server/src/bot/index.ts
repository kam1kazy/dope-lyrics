// TELEGRAM BOT
import { TelegramClient } from '@mtcute/bun'
import { Dispatcher } from '@mtcute/dispatcher'

// КОНСТАНТЫ
import * as env from '../env'

// HANDLERS
import { getChatHistory } from '../handlers/getChatHistory'

const phone = env.BOT_PHONE
const chatId = env.BOT_CHAT_ID
const pass = env.BOT_PASS

// Создаем клиент
const tg = new TelegramClient({
  apiId: env.API_ID,
  apiHash: env.API_HASH,
  storage: './bot-data/session',
})

// Диспетчер событий
const dp = Dispatcher.for(tg)

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

getChatHistory({ tg, chatId })
