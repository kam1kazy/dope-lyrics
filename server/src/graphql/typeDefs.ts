export const typeDefinitions = /* GraphQL */ `
  enum LyricMood {
    AGGRESSION
    LONGING
    IRONY
    TENDERNESS
    BRAVADO
    ANXIETY
    COLD
    EUPHORIA
  }

  enum LyricDelivery {
    PUNCH
    FLOW
    HOOK
    SPOKEN
    TUNE
    ADLIB
    TONGUE_TWISTER
  }

  enum LyricSongRole {
    VERSE
    HOOK
    BRIDGE
    INTRO
    SCENE
    PUNCHLINE
    SKETCH
  }

  enum LyricReadiness {
    LINE
    FRAGMENT
    BLOCK
    TEXT
    READY
  }

  type User {
    id: Int!
    username: String!
    lyrics: [Lyric!]
  }

  type Lyric {
    id: Int!

    lyric_id: Int!
    date: String!
    editDate: String
    isPinned: Boolean!
    isChannelPost: Boolean!
    isReference: Boolean!
    isHidden: Boolean!
    isFavorite: Boolean!
    isCensored: Boolean!
    mood: [LyricMood!]!
    delivery: [LyricDelivery!]!
    songRole: [LyricSongRole!]!
    roleProfiles: [LyricRoleProfile!]!
    readiness: LyricReadiness
    replyToMessage: Int

    message: Message
    user: UserLyric
    chat: Chat
    media: Media

    userId: Int!
  }

  type LyricRoleProfile {
    songRole: LyricSongRole!
    mood: [LyricMood!]!
    delivery: [LyricDelivery!]!
  }

  input LyricRoleProfileInput {
    songRole: LyricSongRole!
    mood: [LyricMood!]!
    delivery: [LyricDelivery!]!
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

  type LyricDemo {
    name: String!
    count: Int!
  }

  type CatalogShelfStat {
    count: Int!
    share: Float!
  }

  type CatalogMoodCount {
    value: LyricMood!
    count: Int!
  }

  type CatalogDeliveryCount {
    value: LyricDelivery!
    count: Int!
  }

  type CatalogReadinessCount {
    value: LyricReadiness!
    count: Int!
  }

  type CatalogRoleStats {
    songRole: LyricSongRole!
    phraseCount: Int!
    mood: [CatalogMoodCount!]!
    delivery: [CatalogDeliveryCount!]!
  }

  type CatalogUnscopedStats {
    phraseCount: Int!
    mood: [CatalogMoodCount!]!
    delivery: [CatalogDeliveryCount!]!
  }

  type CatalogStats {
    phraseCount: Int!
    references: CatalogShelfStat!
    favorites: CatalogShelfStat!
    hidden: CatalogShelfStat!
    censored: CatalogShelfStat!
    withRole: CatalogShelfStat!
    roles: [CatalogRoleStats!]!
    unscoped: CatalogUnscopedStats!
    readiness: [CatalogReadinessCount!]!
    readinessNone: Int!
  }

  type AssembledTrackSlot {
    songRole: LyricSongRole!
    lyricId: Int
    lyric: Lyric
  }

  type AssembledTrack {
    slots: [AssembledTrackSlot!]!
  }

  type LyricCollage {
    id: Int!
    createdAt: String!
    slots: [AssembledTrackSlot!]!
  }

  input CollageSlotInput {
    songRole: LyricSongRole!
    lyricId: Int
  }

  type LyricIngestPreview {
    available: Boolean!
    pendingCount: Int!
  }

  type LyricIngestResult {
    available: Boolean!
    addedCount: Int!
  }

  type Query {
    users: [User!]!
    lyricTags: [String!]!
    lyricEmojis: [String!]!
    lyricDemos: [LyricDemo!]!
    lyrics(
      limit: Int
      offset: Int
      tags: [String!]
      keyword: String
      emojis: [String!]
      dateFrom: String
      dateTo: String
      referencesOnly: Boolean
      favoritesOnly: Boolean
      hiddenOnly: Boolean
      censoredOnly: Boolean
      includeCensored: Boolean
      includeShelves: [String!]
      excludeShelves: [String!]
      demoName: String
      demosOnly: Boolean
      oldestFirst: Boolean
      shuffleSeed: Int
      mood: [LyricMood!]
      excludeMood: [LyricMood!]
      delivery: [LyricDelivery!]
      excludeDelivery: [LyricDelivery!]
      songRole: [LyricSongRole!]
      excludeSongRole: [LyricSongRole!]
      readiness: [LyricReadiness!]
      excludeReadiness: [LyricReadiness!]
    ): [Lyric!]!
    lyricIngestPreview: LyricIngestPreview!
    catalogStats: CatalogStats!
    assembleTrack: AssembledTrack!
    lyricCollages: [LyricCollage!]!
  }

  type Mutation {
    updateLyricFlags(
      id: Int!
      isHidden: Boolean
      isFavorite: Boolean
      isReference: Boolean
      isCensored: Boolean
    ): Lyric!
    updateLyricProfile(
      id: Int!
      mood: [LyricMood!]
      delivery: [LyricDelivery!]
      roleProfiles: [LyricRoleProfileInput!]
      readiness: LyricReadiness
    ): Lyric!
    ingestPendingLyrics: LyricIngestResult!
    likeCollage(slots: [CollageSlotInput!]!): LyricCollage!
  }
`;
