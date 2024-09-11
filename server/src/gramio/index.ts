import { Bot } from 'gramio'
import { ContextType } from '@gramio/contexts'

export const bot = new Bot(process.env.BOT_TOKEN as string)

type Message = ContextType<Bot, 'message'>

bot
  .onError(({ context, kind, error }) => {
    if (context.is('message')) return context.send(`${kind}: ${error.message}`)
  })
  .onStart(({ plugins, info, updatesFrom }) => {
    console.log(``)
    console.log(``)
    console.log(`--------     GRAMIO     -----------`)
    console.log(`plugin list - ${plugins.join(', ')}`)
    console.log(`bot username is @${info.username}`)
    console.log(`updates from ${updatesFrom}`)
    console.log(``)
    console.log(`Loading...`)
    console.log(``)
  })
  .command('start', (context) => context.send('Hi!'))
  .on('message', () => {
    bot.api.sendMessage({
      chat_id: '@dope_lyrics_bot',
      text: 'Chat not exists....',
    })
  })

// bot.on('message', async (context: Message) => {
//   const message = context.
//   const chatId = message.chat.id
//   const text = message.text

//   // сохраняем сообщение в файл
//   const fs = require('fs')
//   fs.appendFile(`messages_${chatId}.txt`, `${text}\n`, (err) => {
//     if (err) {
//       console.error(err)
//     }
//   })
// })
