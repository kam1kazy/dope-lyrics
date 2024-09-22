// TELEGRAM BOT
import { TelegramClient } from '@mtcute/bun'
import { Dispatcher, filters } from '@mtcute/dispatcher'

// КОНСТАНТЫ
import * as env from '../env'

// HANDLERS
import { getChatHistory } from '../handlers/getChatHistory'
import { sendToBotChat } from '../handlers/handlers'

const phone = env.BOT_PHONE
const chatId = env.BOT_CHAT_ID
const channelId = env.BOT_CHANNEL_ID
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

// Команды

dp.onNewMessage(filters.command('chathistory'), async (msg) => {
  await msg.delete()
  await getChatHistory({ tg, chatId: channelId })
    .then(() => {
      msg.answerText('MTCUTE: 📥 История чата получена')
    })
    .catch(() => {
      msg.answerText('MTCUTE: 🛑 Ошибка при получении истории')
    })
})

// Получаем ID чата
dp.onNewMessage(filters.command('chatid'), async (msg) => {
  await msg.delete()
  const text = msg.chat.id
  sendToBotChat({ tg, chatId, text })
  console.log('MTCUTE [CMD]: 💳 Chat ID     ' + msg.chat.id)
})
