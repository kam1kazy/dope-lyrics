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

  enum LyricSource {
    TELEGRAM
    APPLE_NOTES
  }

  enum LyricSortField {
    CREATED
    ADDED
  }

  type User {
    id: Int!
    username: String!
  }

  type Lyric {
    id: Int!

    lyric_id: Int!
    source: LyricSource!
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

  type AiStatus {
    enabled: Boolean!
  }

  type AiPromptVersion {
    id: Int!
    number: Int!
    text: String!
    name: String
    description: String
    createdAt: String!
  }

  type AiPromptMeta {
    name: String!
    description: String!
  }

  type AiUsagePeriod {
    requests: Int!
    tokensIn: Int!
    tokensOut: Int!
    costRub: Float
  }

  type AiUsageSummary {
    today: AiUsagePeriod!
    month: AiUsagePeriod!
    all: AiUsagePeriod!
  }

  type AiUsageItem {
    id: Int!
    createdAt: String!
    kind: String!
    model: String!
    tokensIn: Int!
    tokensOut: Int!
    costRub: Float
    latencyMs: Int!
    status: String!
    error: String
  }

  type CollageRewrite {
    sourceText: String!
    aiText: String!
    usageId: Int!
  }

  enum LineMark {
    RED
    GREEN
  }

  input LineMarkInput {
    line: Int!
    mark: LineMark!
  }

  type LineMarksRevision {
    aiText: String!
    usageId: Int!
  }

  enum TechniqueKind {
    IMAGE
    SOUND
    WORDPLAY
    TONE
  }

  type ArtistTechnique {
    id: Int!
    kind: TechniqueKind!
    label: String!
    instruction: String!
  }

  type ReferenceText {
    id: Int!
    artistId: Int!
    title: String
    text: String!
    note: String
    mood: [String!]!
    delivery: [String!]!
    songRole: [String!]!
    energy: String
    tagged: Boolean!
    createdAt: String!
  }

  type Artist {
    id: Int!
    name: String!
    moods: [String!]!
    energies: [String!]!
    deliveries: [String!]!
    techniques: [ArtistTechnique!]!
    texts: [ReferenceText!]!
    textCount: Int!
  }

  type ArtistTechniqueDraft {
    kind: TechniqueKind!
    label: String!
    instruction: String!
  }

  type ArtistCardDraft {
    name: String!
    moods: [String!]!
    energies: [String!]!
    deliveries: [String!]!
    techniques: [ArtistTechniqueDraft!]!
  }

  input ArtistTechniqueInput {
    kind: TechniqueKind!
    label: String!
    instruction: String!
  }

  input ArtistInput {
    name: String!
    moods: [String!]!
    energies: [String!]!
    deliveries: [String!]!
    techniques: [ArtistTechniqueInput!]!
  }

  input ReferenceTextInput {
    title: String
    text: String
    note: String
    mood: [String!]
    delivery: [String!]
    songRole: [String!]
    energy: String
  }

  type TrackText {
    id: Int!
    createdAt: String!
    theme: String
    sourceText: String!
    aiText: String!
    text: String!
    finalText: String
    doneAt: String
    generation: String
  }

  enum UserRole {
    OWNER
    ADMIN
    USER
  }

  type Profile {
    id: Int!
    username: String!
    role: UserRole!
  }

  enum IngestSourceKind {
    MAIN
    CHANNEL
  }

  enum IngestSourceState {
    READY
    UNAVAILABLE
    ERROR
  }

  type IngestSource {
    key: String!
    title: String!
    kind: IngestSourceKind!
    state: IngestSourceState!
    pendingCount: Int!
  }

  type IngestApplyResult {
    ok: Boolean!
    addedCount: Int!
  }

  type Invite {
    id: Int!
    createdAt: String!
    expiresAt: String!
  }

  type CreatedInvite {
    code: String!
    expiresAt: String!
  }

  input ReferenceFilterInput {
    artistIds: [Int!]
    textIds: [Int!]
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
    sources: [LyricSource!]
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
      sources: [LyricSource!]
      sortField: LyricSortField
    ): [Lyric!]!
    profile: Profile!
    ingestSources: [IngestSource!]!
    myInvites: [Invite!]!
    catalogStats(
      dateFrom: String
      dateTo: String
      includeShelves: [String!]
      excludeShelves: [String!]
      sources: [LyricSource!]
    ): CatalogStats!
    catalogActivity(
      days: Int!
      dateFrom: String
      dateTo: String
      includeShelves: [String!]
      excludeShelves: [String!]
      sources: [LyricSource!]
    ): [CatalogActivityPoint!]!
    assembleTrack(
      form: TrackFormQuotas!
      hideAdlibs: Boolean
      filter: LyricPoolFilter
    ): AssembledTrack!
    lyricCollages: [LyricCollage!]!
    aiStatus: AiStatus!
    aiPrompt: AiPromptVersion
    aiPromptVersions: [AiPromptVersion!]!
    aiUsageSummary: AiUsageSummary!
    aiUsageRecent: [AiUsageItem!]!
    trackTexts: [TrackText!]!
    trackText(id: Int!): TrackText!
    artists: [Artist!]!
    artist(id: Int!): Artist!
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
      sources: [LyricSource!]
      sortField: LyricSortField
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
    ingestSource(key: String!): IngestApplyResult!
    createInvite: CreatedInvite!
    revokeInvite(id: Int!): Boolean!
    likeCollage(slots: [CollageSlotInput!]!): LyricCollage!
    unlikeCollage(id: Int!): Int!
    createAiPrompt(
      text: String!
      name: String!
      description: String!
    ): AiPromptVersion!
    suggestAiPromptMeta(text: String!): AiPromptMeta!
    rewriteCollage(
      slots: [CollageSlotInput!]!
      theme: String
      filter: LyricPoolFilter
      hideAdlibs: Boolean
      references: ReferenceFilterInput
    ): CollageRewrite!
    reviseMarkedLines(
      aiText: String!
      marks: [LineMarkInput!]!
      theme: String
    ): LineMarksRevision!
    createTrackText(
      slots: [CollageSlotInput!]!
      theme: String
      aiText: String
      usageId: Int
      hideAdlibs: Boolean
      generation: String
    ): TrackText!
    updateTrackText(id: Int!, text: String!): TrackText!
    markTrackTextDone(id: Int!): TrackText!
    deleteTrackText(id: Int!): Int!
    createArtist(name: String!): Artist!
    updateArtist(id: Int!, input: ArtistInput!): Artist!
    deleteArtist(id: Int!): Boolean!
    draftArtistCard(id: Int!, name: String!): ArtistCardDraft!
    createReferenceText(artistId: Int!, title: String, text: String!): ReferenceText!
    updateReferenceText(id: Int!, input: ReferenceTextInput!): ReferenceText!
    deleteReferenceText(id: Int!): Boolean!
    tagReferenceText(id: Int!): ReferenceText!
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
