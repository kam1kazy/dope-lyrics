export interface IChatHistoryItem {
  userId: number
  message: {
    text: string
    message_id: number
    word_count: number
    paragraph_count: number
    reactions: {
      emojis: {
        emoji: string
        isPaid: boolean
        count: number
        order: number
      }[]
      uniqueCount: number
      totalFreeCount: number
      totalPaidCount: number
      totalCount: number
    } | null
    hashtags?: {
      tags: string[]
      count: number
    } | null
  }
  user: {
    id: number
    username: string
    displayName: string
    isAdmin: boolean
  }
  chat: {
    id: number
    title: string
    type: string
  }
  date: Date
  editDate: Date | null
  isPinned: boolean
  isChannelPost: boolean
  replyToMessage: number | null
  media: {
    mime: string
    duration: number
    convert: boolean
  } | null
}
