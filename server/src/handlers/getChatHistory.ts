// HANDLERS
import { filterHistory } from './filterHistory'
import { createJSONdata } from './createJSONdata'

// Получаем историю чата
export async function getChatHistory({
  tg,
  chatId,
}: {
  tg: any
  chatId: number
}) {
  const limit = 100
  const offset = {
    id: 0,
    date: Date.now(),
  }
  let data: any[] = []
  console.log('MTCUTE: 🧻 Получаем историю чата...')

  // Пошаговый парсинг
  while (true) {
    try {
      const history = await tg.getHistory(chatId, { limit, offset })

      let chatData: any[] | boolean = []

      if (history.length > 0) {
        chatData = filterHistory(history)
      } else {
        console.error('MTCUTE: 🛑 Получен пустой массив истории чата')
        return false
      }

      if (chatData) {
        data.push(...chatData)
      }

      if (history.length < limit) {
        console.log('MTCUTE: 🌀 Шаги парсинга закончились')
        break
      } else {
        console.log('MTCUTE: 🌀 - Шаг парсинга')
      }

      offset.id += limit
    } catch (error) {
      console.error(
        '\nMTCUTE: 🛑 Ошибка при получении истории сообщений:\n\n',
        error
      )
      break
    }
  }

  // Создаем файл с полученной базой по нашей модели из ILyric
  if (data.length) {
    console.log('MTCUTE: 📥 История чата получена')
    createJSONdata(data)
  }
}
