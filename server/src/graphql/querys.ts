export const typeDefinitions = /* GraphQL */ `
  type User {
    id: Int!
    username: String!
    email: String
    password: String!
    lyrics: [Lyric!]
  }

  type Lyric {
    id: Int!

    lyric_id: Int!
    date: String!
    editDate: String
    isPinned: Boolean!
    isChannelPost: Boolean!
    replyToMessage: Int

    message: Message
    user: User
    chat: Chat
    media: Media

    userId: Int!
  }

  type Message {
    id: Int!

    message_id: Int!
    text: String
    word_count: Int
    paragraph_count: Int

    reactions: Reaction
    hashtags: Hashtag

    lyricId: Int!
  }

  type Reaction {
    id: Int!

    uniqueCount: Int!
    totalFreeCount: Int!
    totalPaidCount: Int!
    totalCount: Int!

    emojis: [Emoji!]!

    messageId: Int!
  }

  type Emoji {
    id: Int!

    emoji: String!
    isPaid: Boolean!
    count: Int!
    order: Int

    reactionId: Int!
  }

  type UserLyric {
    key: Int!

    id: Int!
    username: String
    displayName: String!
    isAdmin: Boolean!

    lyricsId: Int!
  }

  type Chat {
    key: Int!

    id: Int!
    title: String!
    type: String!

    lyricId: Int!
  }

  type Media {
    id: Int!

    mime: String!
    duration: Int!
    convert: Boolean!

    lyricId: Int!
  }

  type Hashtag {
    id: Int!

    tags: [String!]!
    count: Int!

    messageId: Int!
  }

  type Query {
    users: [User!]!
    lyrics: [Lyric!]!
  }
`
