// КОНСТАНТЫ
import { BotKeyboard } from '@mtcute/core'
import * as env from '../../env'

// HANDLERS
import { getChatHistory } from '../../handlers/getChatHistory'
import { sendToBotChat } from '../../handlers/handlers'

// TYPES
import { TypeBotClient } from '../index'

const chatId = env.BOT_CHAT_ID
const channelId = env.BOT_CHANNEL_ID

interface ICommandChat {
  tg: TypeBotClient
  msg: any
}

// Команды для бота
const options = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: 'Открыть приложение',
          url: 'https://violet-cougars-listen.loca.lt',
        },
      ],
    ],
  },
}

// Получаем историю чата
const commandChatHistory = async ({ tg, msg }: ICommandChat) => {
  await msg.delete()
  await getChatHistory({ tg, chatId: channelId })
    .then(() => {
      sendToBotChat({ tg, chatId, text: 'MTCUTE: 📥 История чата получена' })
    })
    .catch(() => {
      sendToBotChat({
        tg,
        chatId,
        text: 'MTCUTE: 🛑 Ошибка при получении истории',
      })
    })
}

// Получаем ID чата
const commandChatId = async ({ tg, msg }: ICommandChat) => {
  await msg.delete()
  const text = 'MTCUTE: 💳 Chat ID: ' + msg.chat.id
  sendToBotChat({ tg, chatId, text })
}

// Открываем приложение
const commandStart = async ({ tg, msg }: ICommandChat) => {
  await msg.delete()
  const text = 'MTCUTE: 📱 Вы хотите открыть приложение?'

  await tg.sendText(msg.chat.id, text, {
    replyMarkup: BotKeyboard.inline([
      [BotKeyboard.url('Запустить', 'https://violet-cougars-listen.loca.lt')],
    ]),
  })
}

export { commandChatHistory, commandChatId, commandStart }
