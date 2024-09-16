export const typeDefinitions = /* GraphQL */ `
  type User {
    id: Int!
    username: String!
    email: String!
    password: String!
    lyrics: [Lyric!]!
  }

  type Lyric {
    id: Int!
    date: String!
    editDate: String
    isPinned: Boolean!
    isChannelPost: Boolean!
    message: Message
    user: User
    chat: Chat
    replyToMessage: Int
    media: Media
  }

  type Message {
    id: Int!
    message_id: Int!
    text: String
    word_count: Int
    paragraph_count: Int
    reactions: Reaction
    hashtags: Hashtag
    lyric: Lyric!
  }

  type Reaction {
    id: Int!
    uniqueCount: Int!
    totalFreeCount: Int!
    totalPaidCount: Int!
    totalCount: Int!
    emojis: [Emoji!]!
    message: Message!
  }

  type Emoji {
    id: Int!
    emoji: String!
    isPaid: Boolean!
    count: Int!
    order: Int
    reaction: Reaction!
  }

  type UserLyric {
    key: Int!
    id: Int!
    username: String
    displayName: String
    isAdmin: Boolean!
    lyrics: Lyric!
  }

  type Chat {
    key: Int!
    id: Int!
    title: String!
    type: String!
    lyric: Lyric!
  }

  type Media {
    id: Int!
    mime: String!
    duration: Int!
    convert: Boolean!
    lyric: Lyric!
  }

  type Hashtag {
    id: Int!
    hashtags: [String!]!
    count: Int!
    message: Message!
  }

  type Query {
    users: [User!]!
    lyrics: [Lyric!]!
    messages: [Message!]!
    reactions: [Reaction!]!
    emojis: [Emoji!]!
    userLyrics: [UserLyric!]!
    chats: [Chat!]!
    media: [Media!]!
    hashtags: [Hashtag!]!
  }
`
