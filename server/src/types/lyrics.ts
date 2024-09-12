interface LyricType {
  id: number
  message: MessageType
  user: UserType
  chat: ChatType
  date: Date
  editDate: Date
  isPinned: boolean
  isChannelPost: boolean
  replyToMessage?: ReplyToMessageType
  media?: MediaType
}

interface MessageType {
  text?: string
  word_count?: number
  paragraph_count?: number
  reactions?: ReactionType
  hashtags?: HashtagsType
}

interface ReactionType {
  reactions: EmojiType[]
  uniqueCount: number
  totalFreeCount: number
  totalPaidCount: number
  totalCount: number
}

interface EmojiType {
  emoji: string
  isPaid: boolean
  count: number
}

interface HashtagsType {
  hashtags: string[]
  count: number
}

interface HashtagDataType {
  offset: number
  length: number
  kind: string
  params: {
    kind: string
  }
  text: string
}

interface UserType {
  id: number
  username?: string
  displayName?: string
  owner?: number
  isAdmin: boolean
}

interface ChatType {
  id: number
  title: string
  type: string
}

interface ReplyToMessageType {
  id: number
}

interface MediaType {
  mimeType: string
  duration: number
  convert: boolean
}

export { LyricType, EmojiType, HashtagsType, HashtagDataType }
