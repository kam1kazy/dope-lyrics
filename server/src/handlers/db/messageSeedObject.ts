import { IChatHistoryItem } from '~/types/prismaCreate'
import { IUser } from '~/types/user'

export const messageSeedObject = (
  record: IChatHistoryItem,
  userId: IUser['id'],
  isUpdate: boolean = false,
) => {
  const baseData = {
    userId: userId,
    lyric_id: record.message.message_id,
    date: record.date,
    editDate: record.editDate,
    isPinned: record.isPinned,
    isChannelPost: record.isChannelPost,
  }

  if (isUpdate) {
    // Для обновления только изменяем основные поля, не трогаем вложенные отношения
    return {
      ...baseData,
      message: record.message
        ? {
            update: {
              text: record.message.text,
              word_count: record.message.word_count,
              paragraph_count: record.message.paragraph_count,
            },
          }
        : undefined,
      // Если нужно обновить другие вложенные данные, добавьте их сюда с осторожностью
    }
  }

  // Для создания используем полную структуру
  return {
    ...baseData,
    message: record.message
      ? {
          create: {
            text: record.message.text,
            message_id: record.message.message_id,
            word_count: record.message.word_count,
            paragraph_count: record.message.paragraph_count,
            reactions: record.message.reactions
              ? {
                  create: {
                    uniqueCount: record.message.reactions.uniqueCount,
                    totalFreeCount: record.message.reactions.totalFreeCount,
                    totalPaidCount: record.message.reactions.totalPaidCount,
                    totalCount: record.message.reactions.totalCount,
                    emojis: { create: record.message.reactions.emojis },
                  },
                }
              : undefined,
            hashtags: record.message.hashtags
              ? {
                  create: {
                    tags: record.message.hashtags.tags.map(tag => tag),
                    count: record.message.hashtags.count,
                  },
                }
              : undefined,
          },
        }
      : undefined,
    user: record.user
      ? {
          create: {
            id: record.user.id,
            username: record.user.username,
            displayName: record.user.displayName,
            isAdmin: record.user.isAdmin,
          },
        }
      : undefined,
    chat: record.chat
      ? {
          create: {
            id: record.chat.id,
            title: record.chat.title,
            type: record.chat.type,
          },
        }
      : undefined,
    replyToMessage: record.replyToMessage ?? null,
    media: record.media
      ? {
          create: {
            mime: record.media.mime,
            duration: record.media.duration,
            convert: record.media.convert,
          },
        }
      : undefined,
  }
}
