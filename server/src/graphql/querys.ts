export const typeDefinitions = /* GraphQL */ `
  type User {
    id: Int!
    name: String!
    email: String
    emailVerified: String
    password: String!
    image: String
    role: String!
    accounts: [Account!]
    lyrics: [Lyric!]
    sessions: [Session!]

    createdAt: String!
    updatedAt: String!
  }

  type Account {
    id: Int!
    userId: Int!
    type: String!
    provider: String!
    providerAccountId: String!
    refresh_token: String
    access_token: String
    expires_at: Int
    token_type: String
    scope: String
    id_token: String
    session_state: String

    createdAt: String!
    updatedAt: String!
  }

  type Session {
    id: Int!
    sessionToken: String!
    userId: Int!
    expires: String!

    createdAt: String!
    updatedAt: String!
  }

  type Lyric {
    id: Int!

    lyricId: Int!
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

    createdAt: String!
    updatedAt: String!
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

createdAt: String!
updatedAt: String!
  }

  type Reaction {
    id: Int!

    uniqueCount: Int!
    totalFreeCount: Int!
    totalPaidCount: Int!
    totalCount: Int!

    emojis: [Emoji!]!

    messageId: Int!

createdAt: String!
updatedAt: String!
  }

  type Emoji {
    id: Int!

    emoji: String!
    isPaid: Boolean!
    count: Int!
    order: Int

    reactionId: Int!

createdAt: String!
updatedAt: String!
  }

  type UserLyric {
    key: Int!

    id: Int!
    name: String
    displayName: String!
    isAdmin: Boolean!

    lyricsId: Int!

createdAt: String!
updatedAt: String!
  }

  type Chat {
    key: Int!

    id: Int!
    title: String!
    type: String!

    lyricId: Int!

    createdAt: String!
    updatedAt: String!
  }

  type Media {
    id: Int!

    mime: String!
    duration: Int!
    convert: Boolean!

    lyricId: Int!

    createdAt: String!
    updatedAt: String!
  }

  type Hashtag {
    id: Int!

    tags: [String!]!
    count: Int!

    messageId: Int!

    createdAt: String!
    updatedAt: String!
  }

  type Query {
    users: [User!]!
    lyrics(limit: Int, offset: Int): [Lyric!]!
    hello: String
    user(id: ID!): User
    userByEmail(email: String!): User
    userByAccount(provider: String!, providerAccountId: String!): User
  }

  type Mutation {
    login(email: String!, password: String!): User
    createUser(name: String!, email: String!): User!
    updateUser(id: ID!, name: String, email: String): User!
    linkAccount(userId: ID!, provider: String!, providerAccountId: String!): Account!
    createSession(sessionToken: String!, userId: ID!, expires: String!): Session!
    deleteSession(sessionToken: String!): Session!
  }
`
