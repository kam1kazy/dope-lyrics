// КОНСТАНТЫ
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

// Получаем историю чата
const commandChatHistory = async ({ tg, msg }: ICommandChat) => {
  await msg.delete()
  await getChatHistory({ tg, chatId: channelId })
    .then(() => {
      msg.answerText('MTCUTE: 📥 История чата получена')
    })
    .catch(() => {
      msg.answerText('MTCUTE: 🛑 Ошибка при получении истории')
    })
}

// Получаем ID чата
const commandChatId = async ({ tg, msg }: ICommandChat) => {
  console.log(msg)

  await msg.delete()
  const text = msg.chat.id
  sendToBotChat({ tg, chatId, text })
  console.log('MTCUTE [CMD]: 💳 Chat ID     ' + msg.chat.id)
}

export { commandChatHistory, commandChatId }
