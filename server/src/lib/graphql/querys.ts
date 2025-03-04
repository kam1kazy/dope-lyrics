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
    refreshToken: String!
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

  type AuthResponse {
    id: Int!
    email: String!
    name: String!
    role: String!
    refreshToken: String!
    sessionToken: String!
  }

  type Response {
    success: Boolean!
    message: String!
  }

  type Query {
    me: User
    user(id: ID!): User
    users: [User!]!
    userByEmail(email: String!): User
    userByAccount(provider: String!, providerAccountId: String!): User
    cookie(name: String): String
    lyrics(limit: Int, offset: Int): [Lyric!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthResponse!
    logout: String!
    createUser(email: String!, password: String!, name: String!): AuthResponse!
    setCookie(name: String, value: String): String
    revokeToken(refreshToken: String!): Response!
    createSession(sessionToken: String!, userId: Int!, expires: String!): Session!
    deleteSession(sessionToken: String!): Session!
  }
`;