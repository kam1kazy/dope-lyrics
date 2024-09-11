import { TelegramClient } from '@mtcute/bun'
import { Dispatcher, filters } from '@mtcute/dispatcher'
import { tl } from '@mtcute/tl'

import * as env from '../env'

const tg = new TelegramClient({
  apiId: env.API_ID,
  apiHash: env.API_HASH,
  storage: 'bot-data/session',
})
const phone = env.BOT_PHONE
const dp = Dispatcher.for(tg)

// Проверяем вход в систему
async function checkSignedIn() {
  try {
    const me = await tg.getMe()
    return console.log('MTCUTE: Вошел в систему как - ', me.username)
  } catch (e) {
    if (tl.RpcError.is(e, 'AUTH_KEY_UNREGISTERED')) {
      console.log('MTCUTE: Не вошел в систему')
      return null
    } else {
      console.log('MTCUTE: Ошибка', e)
      throw e
    }
  }
}
checkSignedIn()

/*
--
--
--
--
--
--
--
--
*/

// Войти как user
const mtUserConnect = await tg.start({
  phone: () => tg.input('Phone > +79851461025'),
  code: () => tg.input('Code > '),
  password: () => tg.input('Password > '),
})

/*
--
--
--
--
--
*/

const code = await tg.sendCode({ phone })

// console.log('MTCUTE: Код отправлен', code.phoneCodeHash)

// // Войти как user
// const mtUserConnect = await tg.signIn({
//   phone,
//   phoneCodeHash: code.phoneCodeHash,
//   phoneCode: code,
// })

/*
--
--
--
--
--
*/

// Команды
dp.onNewMessage(filters.start, async (msg) => {
  await msg.answerText('Hello, world!')
})
dp.onNewMessage(filters.chat('private'), async (msg) => {
  await msg.replyText('hiiii from mtcute! 🌸')
})
