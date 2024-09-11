import { TelegramClient } from '@mtcute/bun'
import { Dispatcher, filters } from '@mtcute/dispatcher'

import * as env from '../env'

const phone = env.BOT_PHONE
const chatId = env.BOT_CHAT_ID

// Создаем клиент
const tg = new TelegramClient({
  apiId: env.API_ID,
  apiHash: env.API_HASH,
  storage: 'bot-data/session',
})

// Диспетчер событий
const dp = Dispatcher.for(tg)

// Запускаем бота
const self = await tg.start({
  phone: () => tg.input('Phone > '),
  code: () => tg.input('Code > '),
  password: () => tg.input('Password > '),
})

if (self) {
  console.log('\n🤖 MTCUTE: Вошел в систему как me -', self.username)
} else {
  console.error('\n🛑 MTCUTE: Не вошел в систему')
}

// Получаем историю чата
async function getChatHistory() {
  try {
    // const history = await tg.getHistory(chatId, { limit: 100 })
    // console.log('\nСообщения из чата:', history)
    // history.messages.forEach((message) => {
    //   console.log(message.text)
    // })
  } catch (error) {
    console.error('\n🛑 MTCUTE: Ошибка при получении истории сообщений:', error)
  }
}

getChatHistory()

// Команды
dp.onNewMessage(filters.chatId(chatId), async (msg) => {
  await msg.replyText('hiiii from dope bot! 🌵')
})

dp.onNewMessage(filters.start, async (msg) => {
  await msg.answerText('Hello, world!')
})

dp.onNewMessage(async (msg) => {
  await msg.answerText('Hello, dope world!')
})
