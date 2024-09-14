export interface UserType {
  id: number
  username: string
  email: string
  password: string
}

export interface LyricType {
  userId: number
  message: MessageType
  user: UserLyricType
  chat: ChatType
  date: Date
  editDate: Date
  isPinned: boolean
  isChannelPost: boolean
  owner: UserType
  replyToMessage: number | null
  media: MediaType
}

export interface UserLyricType {
  id: number
  username?: string
  displayName?: string
  isAdmin: boolean
}

export interface ChatType {
  id: number
  title: string
  type: string
}

export interface MediaType {
  mime: string
  duration: number
  convert: boolean
}

export interface MessageType {
  message_id: number
  text?: string
  word_count?: number
  paragraph_count?: number
  reactions?: ReactionType
  hashtags?: HashtagsType
}

export interface HashtagsType {
  hashtags: string[]
  count: number
}

export interface HashtagDataType {
  offset: number
  length: number
  kind: string
  params: {
    kind: string
  }
  text: string
}

export interface ReactionType {
  emojis: EmojiType[]
  uniqueCount: number
  totalFreeCount: number
  totalPaidCount: number
  totalCount: number
}

export interface EmojiType {
  emoji: string
  isPaid: boolean
  count: number
  order?: null | number
}

export interface ConvertDataType {
  userId: number
  message: {
    create: {
      text: string
      message_id: number
      word_count: number
      paragraph_count: number
      reactions: {
        create: {
          uniqueCount: number
          totalFreeCount: number
          totalPaidCount: number
          totalCount: number
          Emoji: {
            create: {
              emoji: string
              isPaid: boolean
              count: number
              order: number | null
            }[]
          }
        }
      } | null
      hashtags: {
        create: {
          hashtags: string[]
        }
        count: number
      } | null
    }
  }
  user: {
    create: {
      id: number
      username: string | null
      displayName: string
      isAdmin: boolean
    }
  }
  chat: {
    create: {
      id: number
      title: string
      type: string
    }
  }
  date: string
  editDate: string
  isPinned: boolean
  isChannelPost: boolean
  replyToMessage: {
    create: {
      id: number
    }
  } | null
  media: {
    create: {
      mime: string
      duration: number
      convert?: boolean
    }
  } | null
}
