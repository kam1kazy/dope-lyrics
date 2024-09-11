import { TelegramClient } from '@mtcute/bun'
import { Dispatcher, filters } from '@mtcute/dispatcher'

import * as env from '../env'

const tg = new TelegramClient({
  apiId: env.API_ID,
  apiHash: env.API_HASH,
  storage: '../../bot-data/session',
})

const dp = Dispatcher.for(tg)

dp.onNewMessage(filters.start, async (msg) => {
  await msg.answerText('Hello, world!')
})

// Войти как bot
// const mtBotConnect = await tg.start({ botToken: env.BOT_TOKEN })

// Войти как user
const mtUserConnect = await tg.start({
  phone: () => tg.input('Phone > '),
  code: () => tg.input('Code > '),
  password: () => tg.input('Password > '),
})

console.log('Logged in as', mtUserConnect.username)

export { mtUserConnect }
