import { TypeBotClient } from '~/mtcute/index'
import * as env from '~/env'
import {
  CallbackQueryContext,
  filters,
  MessageContext,
} from '@mtcute/dispatcher'

const chatId = env.BOT_CHAT_ID
const botAdminId = Number(env.BOT_ADMIN_ID)

interface IAdminCheck {
  tg: TypeBotClient
  msg: filters.Modify<MessageContext, { command: string[] }>
  msgCallback?: CallbackQueryContext
  action: () => Promise<void>
}

export const useAdminCheck = async ({
  tg,
  msg,
  msgCallback,
  action,
}: IAdminCheck) => {
  if (!msgCallback) {
    msg.delete()
  }

  if (msg.sender?.id === botAdminId || msgCallback?.user?.id === botAdminId) {
    await action()
  } else {
    console.log('Вы не имеете доступ...')
    await tg.sendText(chatId, 'MTCUTE: 🛑 Вы не имеете доступ к этой команде')
  }
}
