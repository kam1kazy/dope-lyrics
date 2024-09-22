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
  let params = {
    limit: 100,
    offset: {
      date: Number(Date.now()),
      id: 0,
    },
  }

  let data: any[] = []
  console.log('MTCUTE: 🧻 Получаем историю чата...')

  // Пошаговый парсинг
  while (true) {
    try {
      const history = await tg.getHistory(chatId, { limit: 20 })
      console.log('MTCUTE: Сообщения из чата:', history.length)

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

      if (history.length < params.limit) {
        break
      }

      params.offset.id += params.limit

      console.log(params.offset.id)
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
