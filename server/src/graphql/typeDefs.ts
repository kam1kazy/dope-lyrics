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

  enum LyricEnergy {
    WHISPER
    QUIET
    EVEN
    LOUD
    SCREAM
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
    isDonor: Boolean!
    isUsed: Boolean!
    mood: [LyricMood!]!
    delivery: [LyricDelivery!]!
    songRole: [LyricSongRole!]!
    roleProfiles: [LyricRoleProfile!]!
    readiness: LyricReadiness
    energy: LyricEnergy
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

  type SplitLyricPayload {
    top: Lyric!
    bottom: Lyric!
  }

  input LyricLineRange {
    afterLine: Int!
    untilLine: Int!
  }

  type SliceLyricPayload {
    source: Lyric!
    created: Lyric!
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

  type CatalogEnergyCount {
    value: LyricEnergy!
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

  enum CatalogThemeKind {
    MOOD
    DELIVERY
  }

  type CatalogThemeCount {
    kind: CatalogThemeKind!
    value: String!
    count: Int!
  }

  type CatalogActivityPoint {
    date: String!
    count: Int!
  }

  type CatalogStats {
    phraseCount: Int!
    addedLastMonth: Int!
    references: CatalogShelfStat!
    favorites: CatalogShelfStat!
    hidden: CatalogShelfStat!
    censored: CatalogShelfStat!
    donors: CatalogShelfStat!
    withRole: CatalogShelfStat!
    roles: [CatalogRoleStats!]!
    unscoped: CatalogUnscopedStats!
    readiness: [CatalogReadinessCount!]!
    readinessNone: Int!
    energy: [CatalogEnergyCount!]!
    energyNone: Int!
    themes: [CatalogThemeCount!]!
  }

  type AssembledTrackPart {
    lyricId: Int!
    startLine: Int!
    endLine: Int!
    lyric: Lyric
  }

  type AssembledTrackSlot {
    songRole: LyricSongRole!
    parts: [AssembledTrackPart!]!
  }

  type AssembledTrack {
    slots: [AssembledTrackSlot!]!
  }

  type LyricCollage {
    id: Int!
    createdAt: String!
    slots: [AssembledTrackSlot!]!
  }

  enum CarouselHistorySource {
    SHUFFLE
    QUEUE
    GENERATOR
    AI
  }

  type CarouselHistory {
    id: Int!
    createdAt: String!
    source: CarouselHistorySource!
    lyricIds: [Int!]!
    previewText: String!
    isLiked: Boolean!
  }

  input CollagePartInput {
    lyricId: Int!
    startLine: Int!
    endLine: Int!
  }

  input CollageSlotInput {
    songRole: LyricSongRole!
    parts: [CollagePartInput!]!
  }

  type LyricIngestPreview {
    available: Boolean!
    pendingCount: Int!
  }

  type LyricIngestResult {
    available: Boolean!
    addedCount: Int!
  }

  input LyricPoolFilter {
    tags: [String!]
    keyword: String
    emojis: [String!]
    dateFrom: String
    dateTo: String
    includeShelves: [String!]
    excludeShelves: [String!]
    mood: [LyricMood!]
    excludeMood: [LyricMood!]
    delivery: [LyricDelivery!]
    excludeDelivery: [LyricDelivery!]
    songRole: [LyricSongRole!]
    excludeSongRole: [LyricSongRole!]
    readiness: [LyricReadiness!]
    excludeReadiness: [LyricReadiness!]
    energy: [LyricEnergy!]
    excludeEnergy: [LyricEnergy!]
  }

  input TrackFormQuotas {
    intro: Int!
    verse: Int!
    hook: Int!
    bridge: Int!
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
      energy: [LyricEnergy!]
      excludeEnergy: [LyricEnergy!]
    ): [Lyric!]!
    lyricIngestPreview: LyricIngestPreview!
    catalogStats: CatalogStats!
    catalogActivity(days: Int!): [CatalogActivityPoint!]!
    assembleTrack(
      form: TrackFormQuotas!
      hideAdlibs: Boolean
      filter: LyricPoolFilter
    ): AssembledTrack!
    lyricCollages: [LyricCollage!]!
    lyricIds(
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
      energy: [LyricEnergy!]
      excludeEnergy: [LyricEnergy!]
    ): [Int!]!
    lyricsByIds(ids: [Int!]!): [Lyric!]!
    carouselHistories: [CarouselHistory!]!
  }

  type Mutation {
    updateLyricFlags(
      id: Int!
      isHidden: Boolean
      isFavorite: Boolean
      isReference: Boolean
      isCensored: Boolean
      isDonor: Boolean
      isUsed: Boolean
    ): Lyric!
    updateLyricProfile(
      id: Int!
      mood: [LyricMood!]
      delivery: [LyricDelivery!]
      roleProfiles: [LyricRoleProfileInput!]
      readiness: LyricReadiness
      energy: LyricEnergy
    ): Lyric!
    updateLyricText(id: Int!, text: String!): Lyric!
    splitLyric(id: Int!, afterLine: Int!): SplitLyricPayload!
    sliceLyric(
      id: Int!
      ranges: [LyricLineRange!]!
      ripDonor: Boolean!
    ): SliceLyricPayload!
    ingestPendingLyrics: LyricIngestResult!
    likeCollage(slots: [CollageSlotInput!]!): LyricCollage!
    unlikeCollage(id: Int!): Int!
    glueLyrics(slots: [CollageSlotInput!]!, hideOriginals: Boolean!): Lyric!
    saveCarouselHistory(
      lyricIds: [Int!]!
      source: CarouselHistorySource!
    ): CarouselHistory!
    likeCarouselHistory(id: Int!): CarouselHistory!
    unlikeCarouselHistory(id: Int!): Int!
    deleteCarouselHistory(id: Int!): Int!
  }
`;
