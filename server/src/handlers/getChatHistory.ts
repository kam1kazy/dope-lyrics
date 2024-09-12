import fs from 'fs'

// TYPES
import { LyricType } from '../types/lyrics'

// HANDLERS
import {
  handlerCountParagraphs,
  handlerCountWords,
  handlerCountReactions,
  handlerWithoutHashtags,
  hashtagStringsOnly,
} from './handlers'

// Создаем JSON файл с данными
const createJSONdata = (chatHistory: LyricType[]) => {
  const jsonData = JSON.stringify(chatHistory, null, 2)

  const dirName = 'bot-data/data'
  const fileName = 'chatHistory.json'
  const fullPath = `${dirName}/${fileName}`

  fs.mkdir(dirName, { recursive: true }, (err) => {
    if (err) {
      console.error('\n🛑 MTCUTE: Ошибка создание папки', err)
    } else {
      fs.writeFile(fullPath, jsonData, (err) => {
        if (err) {
          console.error('\n🛑 MTCUTE: Ошибка создание файла', err)
        } else {
          console.log(
            `🟢 MTCUTE: Файл с историей чата успешно создан в ${fullPath}\n`
          )
        }
      })
    }
  })
}

// Создаем массив с нужными данными из полученной Data
const getChat = (data: any) => {
  const filterData = data.filter((message: any) => {
    return message.action === null
  })

  try {
    const chatHistory: LyricType[] = filterData.map((message: any) => {
      return {
        id: message.id,
        message: {
          text: handlerWithoutHashtags(message.text),
          word_count: handlerCountWords(message.text ?? ''),
          paragraph_count: handlerCountParagraphs(message.text ?? ''),

          reactions: message.reactions?.reactions
            ? {
                reactions: message.reactions?.reactions,
                uniqueCount: message.reactions?.reactions.length,
                totalFreeCount: handlerCountReactions(
                  message.reactions?.reactions,
                  'free'
                ),
                totalPaidCount: handlerCountReactions(
                  message.reactions?.reactions,
                  'paid'
                ),
                totalCount: handlerCountReactions(
                  message.reactions?.reactions,
                  'total'
                ),
              }
            : null,

          hashtags: message.entities
            ? {
                hashtag: hashtagStringsOnly(message.entities),
                count: message.entities?.length,
              }
            : null,
        },
        user: {
          id: message.sender.id,
          username: message.sender.username,
          displayName: message.sender.displayName,
          owner: 0,
          isAdmin: message.sender.isAdmin,
        },
        chat: {
          id: message.chat.id,
          title: message.chat.title,
          type: message.chat.type,
        },
        date: message.date,
        editDate: message.editDate,
        isPinned: message.isPinned,
        isChannelPost: message.isChannelPost,
        replyToMessage: message.replyToMessage
          ? { id: message.replyToMessage.id }
          : false,
        media: message.media
          ? {
              mimeType: message.media.mimeType,
              duration: message.media.duration,
              convert: message.media.convert,
            }
          : false,
      }
    })

    return chatHistory
  } catch (error) {
    console.error(
      '\n🛑 MTCUTE: Ошибка при создании объекта chatHistory:',
      error
    )
  }
}

export { getChat, createJSONdata }
