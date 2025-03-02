import { TypeBotClient } from '../../../lib/mtcute'

interface ISendToBotChat {
  tg: TypeBotClient
  chatId: number
  text: string
}

// Отправить в определенный чат
const sendToBotChat = ({ tg, chatId, text }: ISendToBotChat) => {
    tg.sendText(chatId, text.toString())
  }

export  { sendToBotChat }