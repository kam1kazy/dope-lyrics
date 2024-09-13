// TELEGRAM BOT
import { TelegramClient } from '@mtcute/bun'
import { Dispatcher, filters } from '@mtcute/dispatcher'

// КОНСТАНТЫ
import * as env from '../env'

// ФУНКЦИИ
import { getChat, createJSONdata } from '../handlers/getChatHistory'

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
      const code = await prompt('MTCUTE: 🙈  Введите код:')
      if (code === null) {
        throw new Error('MTCUTE: ❌  Отменено пользователем\n\n')
      }
      return code
    },
    password: pass,
  })
  .then((self) => {
    console.log('\nMTCUTE: 🤖 Вошел в систему как -', self.username)
  })
  .catch((error) => {
    console.error('\nMTCUTE: 🛑  Не вошел в систему\n\n', error)
  })

// Получаем историю чата
export async function getChatHistory() {
  const limit = 100
  let offset = {
    id: 0,
    date: Date.now(),
  }
  let data: any[] = []

  console.log('MTCUTE: 🧻 Получаем историю чата...')

  // Пошаговый парсинг
  while (true) {
    try {
      const history = await tg.getHistory(chatId, { limit, offset })
      const chatData = getChat(history)

      if (chatData) {
        data.push(...chatData)
      }

      if (history.length < limit) {
        break
      }

      offset.id += limit
    } catch (error) {
      console.error(
        '\nMTCUTE: 🛑 Ошибка при получении истории сообщений:\n\n',
        error
      )
      break
    }
  }

  // Создаем файл с полученной базой по нашей модели из LyricType
  if (data.length) {
    console.log('MTCUTE: 📥 История чата получена')
    createJSONdata(data)
  }
}

getChatHistory()

// Команды
// dp.onNewMessage(filters.chatId(chatId), async (msg) => {
//   await msg.replyText('hiiii from dope bot! 🌵')
// })

// dp.onNewMessage(filters.start, async (msg) => {
//   await msg.answerText('Hello, world!')
// })

// dp.onNewMessage(async (msg) => {
//   await msg.answerText('Hello, dope world!')
// })
