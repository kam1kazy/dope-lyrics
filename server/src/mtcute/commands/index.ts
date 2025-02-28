// КОНСТАНТЫ
import { BotKeyboard, tl } from '@mtcute/core'
import * as env from '../../env'

// HANDLERS
import { getChatHistory } from '../../handlers/getChatHistory'
import { sendToBotChat } from '../../handlers/handlers'

// TYPES
import { TypeBotClient } from '../index'

// HOOKS
import { useAdminCheck } from '~/hooks/useAdminCheck'

// PRISMA
import seed from '../../../prisma/script/seed'

// Дата базы
import { prisma } from '~/lib/prisma'
import { prismaService } from '~/services/db'

// TYPES
import {
  CallbackQueryContext,
  filters,
  MessageContext,
} from '@mtcute/dispatcher'

const chatId = env.BOT_CHAT_ID
const channelId = env.BOT_CHANNEL_ID

interface ICommandChat {
  tg?: TypeBotClient | null
  tgAdmin?: TypeBotClient | null
  msg:
  | filters.Modify<MessageContext, { command: string[] }>
  | CallbackQueryContext
  keyboard?: tl.TypeKeyboardButton[][]
}

// Получаем ID чата
const commandChatId = async ({ tg, msg }: ICommandChat) => {
  if (!tg) return
  await tg
    .deleteMessagesById(msg.chat.id, [msg.id as number])
    .catch(console.error)

  await useAdminCheck({
    tg,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    action: async () => {
      const text = '💳 Chat ID: ' + msg.chat.id
      sendToBotChat({ tg, chatId: msg.chat.id, text })
    },
  })
}

// Открываем приложение
const commandStartApp = async ({ tg, msg }: ICommandChat) => {
  if (!tg) return
  await useAdminCheck({
    tg,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    action: async () => {
      const text = '📱 Вы хотите открыть приложение?'
      await tg.sendText(msg.chat.id, text, {
        replyMarkup: BotKeyboard.inline([
          [BotKeyboard.url('Запустить', `https://${env.SITE_URL}/`)],
        ]),
      })
    },
  })
}

// Управление базой данных
const commandStartBd = async ({ tg, msg, keyboard }: ICommandChat) => {
  if (!tg) return
  await useAdminCheck({
    tg,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    action: async () => {
      const text = '⚡️ Управление базой данных'
      await tg.sendText(msg.chat.id, text, {
        replyMarkup: BotKeyboard.inline(keyboard ?? []),
      })
    },
  })
}

// Получаем историю чата
const commandChatHistory = async ({ tgAdmin, msg }: ICommandChat) => {
  if (!tgAdmin) return
  await useAdminCheck({
    tg: tgAdmin,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    action: async () => {
      await getChatHistory({ tg: tgAdmin, chatId: channelId })
    },
  })
}

// Заполняем базу данных
const seedToBD = async ({ tgAdmin, msg, tg }: ICommandChat) => {
  if (!tgAdmin) return

  await useAdminCheck({
    tg: tgAdmin,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    msgCallback: msg as CallbackQueryContext,
    action: async () => {
      sendToBotChat({
        tg: tgAdmin,
        chatId,
        text: '🌱 Начался посев...',
      })

      await seed()
    },
  })
}

// Очищаем базу данных
const clearBD = async ({ tgAdmin, msg }: ICommandChat) => {
  if (!tgAdmin) return
  await useAdminCheck({
    tg: tgAdmin,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    msgCallback: msg as CallbackQueryContext,
    action: async () => {
      sendToBotChat({
        tg: tgAdmin,
        chatId,
        text: '🧹 Началась очистка базы...',
      })
      await prismaService.clearDatabase()
    },
  })
}

// Получение статистики
const getStats = async ({ tgAdmin, msg }: ICommandChat) => {
  if (!tgAdmin) return
  await useAdminCheck({
    tg: tgAdmin,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    action: async () => {
      const stats = await prismaService.getStats()

      sendToBotChat({
        tg: tgAdmin,
        chatId,
        text: `📊 Статистика: \n\nUsers: ${stats?.users} \nLyrics: ${stats?.lyrics}`,
      })
    },
  })
}

export {
  commandChatHistory,
  commandChatId,
  commandStartApp,
  commandStartBd,
  seedToBD,
  clearBD,
  getStats,
}
