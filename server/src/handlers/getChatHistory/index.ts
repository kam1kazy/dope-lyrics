// HANDLERS
import { filterHistory } from './filterHistory'
import { createJSONdata } from './createJSONdata'

// TYPES
import { TypeBotClient } from '../../mtcute/index'
import { sendToBotChat } from '../handlers'

// Получаем историю чата
export async function getChatHistory({
  tg,
  chatId,
}: {
  tg: TypeBotClient
  chatId: number
}) {
  let params = {
    limit: 100,
    offset: {
      id: 0,
      date: Math.floor(Date.now() / 1000),
    },
  }

  let data: any[] = []
  let totalMessages = 0

  console.log('MTCUTE: 🧻 Получаем историю чата...')

  // Пошаговый парсинг
  while (true) {
    try {
      // Делаем паузу перед каждым запросом
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const history = await tg.getHistory(chatId, {
        limit: params.limit,
        offset: params.offset,
      })

      let chatData: any[] | boolean = []

      if (history.length > 0) {
        chatData = filterHistory(history)
      } else {
        console.log('MTCUTE: Достигнут конец истории')
        break
      }

      if (chatData) {
        data.push(...chatData)
      }

      if (history.length < params.limit) {
        console.log('MTCUTE: Всего собрано сообщений:', data.length)
        console.log(
          'MTCUTE: Убрано системных сообщений:',
          totalMessages - data.length,
          ' \n'
        )
        break
      }

      if (history.length > totalMessages) {
        totalMessages = history[history.length - 1].id
      }

      params.offset = {
        id: history[history.length - 1].id,
        date: history[history.length - 1].date.getTime(),
      }
    } catch (error: any) {
      // Обработка FLOOD_WAIT
      if (error.code === 420) {
        const seconds = error.seconds || 30
        console.log(
          `MTCUTE: ⏳ Ожидание ${seconds} секунд из-за ограничения API...`
        )
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
        continue // Повторяем попытку после ожидания
      }

      console.error(
        '\nMTCUTE: 🛑 Ошибка при получении истории сообщений:\n\n',
        error
      )
      break
    }
  }

  // Создаем файл с полученной базой
  if (data.length) {
    console.log(`MTCUTE: 📥 История чата получена (${data.length} сообщений)`)
    createJSONdata(data)
    return true
  }

  return false
}
