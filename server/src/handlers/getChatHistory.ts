// TYPES
import { LyricType } from '../types'

// HANDLERS
import {
  handlerCountParagraphs,
  handlerCountWords,
  handlerCountReactions,
  handlerWithoutHashtags,
  hashtagStringsOnly,
} from './handlers'

import { createJSONdata } from './createJSONdata'

// Создаем массив с нужными данными из полученной Data
const getChat = (data: any) => {
  const filterData = data.filter((message: any) => {
    return message.action === null
  })

  try {
    const chatHistory: LyricType[] = filterData.map((message: any) => {
      return {
        userId: 0,
        message: {
          text: handlerWithoutHashtags(message.text),
          message_id: message.id,
          word_count: handlerCountWords(message.text ?? ''),
          paragraph_count: handlerCountParagraphs(message.text ?? ''),

          reactions: message.reactions?.reactions
            ? {
                emojis: message.reactions?.reactions,
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

          hashtags: message.entities?.length
            ? {
                hashtags: hashtagStringsOnly(message.entities),
                count: message.entities?.length,
              }
            : null,
        },
        user: {
          id: message.sender.id,
          username: message.sender.username,
          displayName: message.sender.displayName,
          isAdmin: message.sender.isAdmin,
        },
        chat: {
          id: message.chat.id,
          title: message.chat.title,
          type: message.chat.type,
        },
        date: new Date(Date.parse(message.date)),
        editDate: new Date(Date.parse(message.editDate)) ?? null,
        isPinned: message.isPinned,
        isChannelPost: message.isChannelPost,
        replyToMessage: message.replyToMessage?.id ?? null,
        media: message.media?.mimeType
          ? {
              mime: message.media.mimeType,
              duration: message.media.duration,
              convert: false,
            }
          : null,
      }
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

export { getChat, createJSONdata }
