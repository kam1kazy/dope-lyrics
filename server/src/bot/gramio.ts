import { Bot } from 'gramio'

const bot = new Bot(process.env.BOT_TOKEN as string)
  .command('start', (context) => {
    context.send('Hello!')
  })
  .onStart(() => {
    console.log('Bot started!')
  })
