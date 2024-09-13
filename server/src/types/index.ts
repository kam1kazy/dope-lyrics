export interface UserType {
  id: number
  username: string
  email: string
  password: string
}

export interface LyricType {
  id: number
  owner: UserType
  message: MessageType
  user: UserLyricType
  chat: ChatType
  date: Date
  editDate?: Date | null
  isPinned: boolean
  isChannelPost: boolean
  replyToMessage?: null | ReplyToMessageType
  media?: boolean | MediaType

  userId: number
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
  convert?: boolean
}

export interface MessageType {
  text?: string
  word_count?: number
  paragraph_count?: number
  reactions?: ReactionType | null
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
  reactions: EmojiType[]
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

export interface ReplyToMessageType {
  id: number
}

export type DataType = {
  id: number
  owner: number
  message: {
    text: string
    word_count: number
    paragraph_count: number
    reactions: null | ReactionType
    hashtags: {
      hashtags: string[]
      count: number
    }
  }
  user: {
    id: number
    username: null
    displayName: string
    owner: number
    isAdmin: boolean
  }
  chat: {
    id: number
    title: string
    type: string
  }
  date: string
  editDate: string
  isPinned: boolean
  isChannelPost: boolean
  replyToMessage: null | ReplyToMessageType
  media: boolean | MediaType | {}
}
