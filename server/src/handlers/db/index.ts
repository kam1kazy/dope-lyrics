import { IChatHistoryItem } from '~/types/prismaCreate'
import { IUser } from '~/types/user'

export const messageObject = (
  record: IChatHistoryItem,
  userId: IUser['id']
) => {
  return {
    //? LYRICS
    userId: userId,
    lyric_id: record.message?.message_id ?? null,
    date: record.date,
    editDate: record.editDate,
    isPinned: record.isPinned,
    isChannelPost: record.isChannelPost,

    //? MESSAGE
    message: record.message
      ? {
          create: {
            text: record.message.text,
            message_id: record.message.message_id,
            word_count: record.message.word_count,
            paragraph_count: record.message.paragraph_count,

            //? REACTION
            reactions: record.message.reactions
              ? {
                  create: {
                    uniqueCount: record.message.reactions.uniqueCount,
                    totalFreeCount: record.message.reactions.totalFreeCount,
                    totalPaidCount: record.message.reactions.totalPaidCount,
                    totalCount: record.message.reactions.totalCount,
                    emojis: {
                      create: record.message.reactions.emojis,
                    },
                  },
                }
              : undefined,

            //? HASHTAG
            hashtags: record.message.hashtags
              ? {
                  create: {
                    tags: record.message.hashtags.tags.map((tag) => tag),
                    count: record.message.hashtags.count,
                  },
                }
              : undefined,
          },
        }
      : undefined,

    //? USERS
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

    //? CHAT
    chat: record.chat
      ? {
          create: {
            id: record.chat.id,
            title: record.chat.title,
            type: record.chat.type,
          },
        }
      : undefined,

    //? REPLY
    replyToMessage: record.replyToMessage ?? null,

    //? MEDIA
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
