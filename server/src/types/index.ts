export interface UserType {
  id: number
  username?: string
  displayName?: string
  owner?: number
  isAdmin: boolean
}

export interface LyricType {
  id: number
  message: MessageType
  user: UserType
  chat: ChatType
  date: Date
  editDate: Date | null
  isPinned: boolean
  isChannelPost: boolean
  replyToMessage?: ReplyToMessageType
  media?: MediaType
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
}

export interface ReplyToMessageType {
  id: {
    id: number
  }
}
