// TYPES
import { ILyric } from '../../types/lyric'
import { IMessage } from '../../types/dataMessage'

// HANDLERS
import {
  handlerCountParagraphs,
  handlerCountWords,
  handlerCountReactions,
  handlerWithoutHashtags,
  hashtagStringsOnly,
} from '../filtres'

// OBJECTS
import messageObject from './objMessage'

// Создаем массив с нужными данными из полученной Data
const filterHistory = (data: any) => {
  // Убираем из полученной истории чата системные сообщения
  const filterData = data.filter((message: IMessage) => {
    return message.action === null
  })

  // Создаем новый массив из отфильтрованного исходника
  try {
    const chatHistory: ILyric[] = filterData.map((message: IMessage) => {
      return messageObject({
        message,
        handlerCountParagraphs,
        handlerCountWords,
        handlerCountReactions,
        handlerWithoutHashtags,
        hashtagStringsOnly,
      })
    })

    return chatHistory
  } catch (error) {
    console.error(
      '\n🛑 MTCUTE: Ошибка при создании объекта chatHistory:\n\n',
      error
    )
    return false
  }
}

export { filterHistory }
