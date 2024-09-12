// TELEGRAM BOT
import { TelegramClient } from '@mtcute/bun'
import { Dispatcher, filters } from '@mtcute/dispatcher'

// КОНСТАНТЫ
import * as env from '../env'

// ФУНКЦИИ
import { getChat } from '../handlers/getChatHandlers'

const phone = env.BOT_PHONE
const chatId = env.BOT_CHAT_ID
const pass = env.BOT_PASS

// Создаем клиент
const tg = new TelegramClient({
  apiId: env.API_ID,
  apiHash: env.API_HASH,
  storage: 'bot-data/session',
})

// Диспетчер событий
const dp = Dispatcher.for(tg)

// Авторизуемся в боте
const self = await tg.start({
  phone: phone,
  code: async () => {
    const code = await prompt('🙈 Введите код:')
    if (code === null) {
      throw new Error('❌ Отменено пользователем')
    }
    return code
  },
  password: pass,
})

if (self) {
  console.log('\n🤖 MTCUTE: Вошел в систему как -', self.username)
} else {
  console.error('\n🛑 MTCUTE: Не вошел в систему')
}

// Получаем историю чата
export async function getChatHistory() {
  try {
    const history = await tg.getHistory(chatId, { limit: 5 })
    console.log('🟢 MTCUTE: История чата получена')

    getChat(history)
  } catch (error) {
    console.error('\n🛑 MTCUTE: Ошибка при получении истории сообщений:', error)
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
