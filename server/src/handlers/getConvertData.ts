// TYPES
import { LyricType } from '../types'

// DATA
import chatHistory from '../../bot-data/data/chatHistory.json'

// HANDLERS

import { createConvertData } from './createConvertData'

const arrData: LyricType[] = chatHistory

const convertData = (arrData: LyricType[]) => {
  try {
    const newChatHistory: any = arrData.map((item) => {
      return {
        userId: 0,
        message: {
          create: {
            text: item.message.text,
            message_id: item.message.message_id,
            word_count: item.message.word_count,
            paragraph_count: item.message.paragraph_count,

            reactions: item.message.reactions?.totalCount
              ? {
                  create: {
                    uniqueCount: item.message.reactions.uniqueCount,
                    totalFreeCount: item.message.reactions.totalFreeCount,
                    totalPaidCount: item.message.reactions.totalPaidCount,
                    totalCount: item.message.reactions.totalCount,
                    Emoji: {
                      create: item.message.reactions.reactions,
                    },
                  },
                }
              : null,

            hashtags: item.message.hashtags?.hashtags.length
              ? {
                  create: {
                    hashtags: item.message.hashtags.hashtags,
                  },
                  count: item.message.hashtags.count,
                }
              : null,
          },
        },
        user: {
          create: item.user,
        },
        chat: {
          create: item.chat,
        },
        date: item.date,
        editDate: item.editDate,
        isPinned: item.isPinned,
        isChannelPost: item.isChannelPost,
        replyToMessage: item.replyToMessage?.id
          ? {
              create: {
                id: item.replyToMessage.id,
              },
            }
          : null,
        media: item.media?.mime
          ? {
              create: {
                mime: item.media.mime,
                duration: item.media.duration,
                convert: item.media?.convert,
              },
            }
          : null,
      }
    })
    createConvertData(newChatHistory)
  } catch (error) {
    console.error(
      '\n🛑 PRISMA: Ошибка конвертации объекта chatHistory:\n\n',
      error
    )
    return false
  }
}

convertData(arrData)

export default convertData
