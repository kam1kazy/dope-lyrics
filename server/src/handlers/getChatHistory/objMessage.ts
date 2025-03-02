import { IHashtagData, IMessage } from '~/types/dataMessage'
import { IEmoji } from '~/types/lyric'

interface IProps {
  message: IMessage
  handlerCountParagraphs: (text: string) => number
  handlerCountWords: (text: string) => number
  handlerCountReactions: (
    reactions: IEmoji[],
    type: 'total' | 'paid' | 'free'
  ) => number | void
  handlerWithoutHashtags: (text: string) => string
  hashtagStringsOnly: (entities: IHashtagData[]) => any[]
}

const messageObject = ({
  message,
  handlerCountParagraphs,
  handlerCountWords,
  handlerCountReactions,
  handlerWithoutHashtags,
  hashtagStringsOnly,
}: IProps) => {
  return {
    userId: 0,
    lyricId: message.id,
    message: {
      text: handlerWithoutHashtags(message.text),
      message_id: message.id,
      word_count: handlerCountWords(message.text ?? ''),
      paragraph_count: handlerCountParagraphs(message.text ?? ''),

      reactions: message.reactions?.reactions
        ? {
            emojis: message.reactions?.reactions
              ? message.reactions?.reactions.map((emoji: IEmoji) => {
                  return {
                    emoji: emoji.emoji,
                    isPaid: emoji.isPaid,
                    count: emoji.count,
                    order: emoji.order,
                  }
                })
              : [],
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
            tags: hashtagStringsOnly(message.entities),
            count: message.entities?.length,
          }
        : null,
    },
    user: {
      id: message.sender.id,
      username: message.sender.username,
      isAdmin: message.sender.isAdmin,
    },
    chat: {
      id: message.chat.id,
      title: message.chat.title,
      type: message.chat.chatType,
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
}

export default messageObject
