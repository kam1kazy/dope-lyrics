import { readinessFromLineCount } from '~/modules/lyrics/lyric-facets';
import type { IChatHistoryItem } from '~/modules/lyrics/lyrics.types';
import type { IUser } from '~/modules/users/users.types';

export const createLyricData = (
  record: IChatHistoryItem,
  userId: IUser['id']
) => {
  return {
    userId,
    lyric_id: record.message?.message_id ?? null,
    source: 'TELEGRAM' as const,
    date: record.date,
    editDate: record.editDate,
    isPinned: record.isPinned,
    isChannelPost: record.isChannelPost,
    readiness: readinessFromLineCount(record.message?.paragraph_count),

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
                    emojis: {
                      create: record.message.reactions.emojis,
                    },
                  },
                }
              : undefined,

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
  };
};
