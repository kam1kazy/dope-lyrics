import { gql } from '@apollo/client';

export const LYRIC_TAGS = gql`
  query LyricTags {
    lyricTags
  }
`;

export const LYRIC_EMOJIS = gql`
  query LyricEmojis {
    lyricEmojis
  }
`;

export const LYRIC_LIST_FIELDS = gql`
  fragment LyricListFields on Lyric {
    id
    lyric_id
    date
    editDate
    isPinned
    isChannelPost
    isReference
    isHidden
    isFavorite
    isCensored
    isDonor
    isUsed
    mood
    delivery
    songRole
    roleProfiles {
      songRole
      mood
      delivery
    }
    readiness
    energy
    replyToMessage
    message {
      id
      text
      word_count
      hashtags {
        id
        count
        tags
      }
      reactions {
        id
        totalCount
        emojis {
          id
          emoji
          count
          order
        }
      }
    }
  }
`;

export const ALL_LYRICS = gql`
  ${LYRIC_LIST_FIELDS}
  query AllLyrics(
    $tags: [String!]
    $keyword: String
    $emojis: [String!]
    $dateFrom: String
    $dateTo: String
    $referencesOnly: Boolean
    $favoritesOnly: Boolean
    $hiddenOnly: Boolean
    $censoredOnly: Boolean
    $includeCensored: Boolean
    $includeShelves: [String!]
    $excludeShelves: [String!]
    $demoName: String
    $demosOnly: Boolean
    $limit: Int
    $offset: Int
    $oldestFirst: Boolean
    $shuffleSeed: Int
    $mood: [LyricMood!]
    $excludeMood: [LyricMood!]
    $delivery: [LyricDelivery!]
    $excludeDelivery: [LyricDelivery!]
    $songRole: [LyricSongRole!]
    $excludeSongRole: [LyricSongRole!]
    $readiness: [LyricReadiness!]
    $excludeReadiness: [LyricReadiness!]
    $energy: [LyricEnergy!]
    $excludeEnergy: [LyricEnergy!]
  ) {
    lyrics(
      tags: $tags
      keyword: $keyword
      emojis: $emojis
      dateFrom: $dateFrom
      dateTo: $dateTo
      referencesOnly: $referencesOnly
      favoritesOnly: $favoritesOnly
      hiddenOnly: $hiddenOnly
      censoredOnly: $censoredOnly
      includeCensored: $includeCensored
      includeShelves: $includeShelves
      excludeShelves: $excludeShelves
      demoName: $demoName
      demosOnly: $demosOnly
      limit: $limit
      offset: $offset
      oldestFirst: $oldestFirst
      shuffleSeed: $shuffleSeed
      mood: $mood
      excludeMood: $excludeMood
      delivery: $delivery
      excludeDelivery: $excludeDelivery
      songRole: $songRole
      excludeSongRole: $excludeSongRole
      readiness: $readiness
      excludeReadiness: $excludeReadiness
      energy: $energy
      excludeEnergy: $excludeEnergy
    ) {
      ...LyricListFields
    }
  }
`;

export const LYRIC_DEMOS = gql`
  query LyricDemos {
    lyricDemos {
      name
      count
    }
  }
`;

export const UPDATE_LYRIC_PROFILE = gql`
  mutation UpdateLyricProfile(
    $id: Int!
    $mood: [LyricMood!]
    $delivery: [LyricDelivery!]
    $roleProfiles: [LyricRoleProfileInput!]
    $readiness: LyricReadiness
    $energy: LyricEnergy
  ) {
    updateLyricProfile(
      id: $id
      mood: $mood
      delivery: $delivery
      roleProfiles: $roleProfiles
      readiness: $readiness
      energy: $energy
    ) {
      id
      lyric_id
      mood
      delivery
      songRole
      roleProfiles {
        songRole
        mood
        delivery
      }
      readiness
      energy
    }
  }
`;

export const LYRIC_INGEST_PREVIEW = gql`
  query LyricIngestPreview {
    lyricIngestPreview {
      available
      pendingCount
    }
  }
`;

export const INGEST_PENDING_LYRICS = gql`
  mutation IngestPendingLyrics {
    ingestPendingLyrics {
      available
      addedCount
    }
  }
`;

export const CATALOG_STATS = gql`
  query CatalogStats {
    catalogStats {
      phraseCount
      addedLastMonth
      references {
        count
        share
      }
      favorites {
        count
        share
      }
      hidden {
        count
        share
      }
      censored {
        count
        share
      }
      donors {
        count
        share
      }
      withRole {
        count
        share
      }
      roles {
        songRole
        phraseCount
        mood {
          value
          count
        }
        delivery {
          value
          count
        }
      }
      unscoped {
        phraseCount
        mood {
          value
          count
        }
        delivery {
          value
          count
        }
      }
      readiness {
        value
        count
      }
      readinessNone
      energy {
        value
        count
      }
      energyNone
      themes {
        kind
        value
        count
      }
    }
  }
`;

export const CATALOG_ACTIVITY = gql`
  query CatalogActivity($days: Int!) {
    catalogActivity(days: $days) {
      date
      count
    }
  }
`;

export const UPDATE_LYRIC_FLAGS = gql`
  mutation UpdateLyricFlags(
    $id: Int!
    $isHidden: Boolean
    $isFavorite: Boolean
    $isReference: Boolean
    $isCensored: Boolean
    $isDonor: Boolean
    $isUsed: Boolean
  ) {
    updateLyricFlags(
      id: $id
      isHidden: $isHidden
      isFavorite: $isFavorite
      isReference: $isReference
      isCensored: $isCensored
      isDonor: $isDonor
      isUsed: $isUsed
    ) {
      id
      lyric_id
      isReference
      isHidden
      isFavorite
      isCensored
      isDonor
      isUsed
    }
  }
`;

export const UPDATE_LYRIC_TEXT = gql`
  ${LYRIC_LIST_FIELDS}
  mutation UpdateLyricText($id: Int!, $text: String!) {
    updateLyricText(id: $id, text: $text) {
      ...LyricListFields
    }
  }
`;

export const SPLIT_LYRIC = gql`
  ${LYRIC_LIST_FIELDS}
  mutation SplitLyric($id: Int!, $afterLine: Int!) {
    splitLyric(id: $id, afterLine: $afterLine) {
      top {
        ...LyricListFields
      }
      bottom {
        ...LyricListFields
      }
    }
  }
`;

export const SLICE_LYRIC = gql`
  ${LYRIC_LIST_FIELDS}
  mutation SliceLyric(
    $id: Int!
    $ranges: [LyricLineRange!]!
    $ripDonor: Boolean!
  ) {
    sliceLyric(id: $id, ranges: $ranges, ripDonor: $ripDonor) {
      source {
        ...LyricListFields
      }
      created {
        ...LyricListFields
      }
    }
  }
`;

const COLLAGE_SLOT_FIELDS = `
  songRole
  parts {
    lyricId
    startLine
    endLine
    lyric {
      id
      message {
        text
      }
    }
  }
`;

export const ASSEMBLE_TRACK = gql`
  query AssembleTrack(
    $form: TrackFormQuotas!
    $hideAdlibs: Boolean
    $filter: LyricPoolFilter
  ) {
    assembleTrack(form: $form, hideAdlibs: $hideAdlibs, filter: $filter) {
      slots {
        ${COLLAGE_SLOT_FIELDS}
      }
    }
  }
`;

export const LYRIC_COLLAGES = gql`
  query LyricCollages {
    lyricCollages {
      id
      createdAt
      slots {
        ${COLLAGE_SLOT_FIELDS}
      }
    }
  }
`;

export const LIKE_COLLAGE = gql`
  mutation LikeCollage($slots: [CollageSlotInput!]!) {
    likeCollage(slots: $slots) {
      id
      createdAt
      slots {
        ${COLLAGE_SLOT_FIELDS}
      }
    }
  }
`;

export const UNLIKE_COLLAGE = gql`
  mutation UnlikeCollage($id: Int!) {
    unlikeCollage(id: $id)
  }
`;

export const GLUE_LYRICS = gql`
  ${LYRIC_LIST_FIELDS}
  mutation GlueLyrics($slots: [CollageSlotInput!]!, $hideOriginals: Boolean!) {
    glueLyrics(slots: $slots, hideOriginals: $hideOriginals) {
      ...LyricListFields
    }
  }
`;

export const CAROUSEL_HISTORY_FIELDS = gql`
  fragment CarouselHistoryFields on CarouselHistory {
    id
    createdAt
    source
    lyricIds
    previewText
    isLiked
  }
`;

export const LYRIC_IDS = gql`
  query LyricIds(
    $tags: [String!]
    $keyword: String
    $emojis: [String!]
    $dateFrom: String
    $dateTo: String
    $referencesOnly: Boolean
    $favoritesOnly: Boolean
    $hiddenOnly: Boolean
    $censoredOnly: Boolean
    $includeCensored: Boolean
    $includeShelves: [String!]
    $excludeShelves: [String!]
    $demoName: String
    $demosOnly: Boolean
    $oldestFirst: Boolean
    $shuffleSeed: Int
    $mood: [LyricMood!]
    $excludeMood: [LyricMood!]
    $delivery: [LyricDelivery!]
    $excludeDelivery: [LyricDelivery!]
    $songRole: [LyricSongRole!]
    $excludeSongRole: [LyricSongRole!]
    $readiness: [LyricReadiness!]
    $excludeReadiness: [LyricReadiness!]
    $energy: [LyricEnergy!]
    $excludeEnergy: [LyricEnergy!]
  ) {
    lyricIds(
      tags: $tags
      keyword: $keyword
      emojis: $emojis
      dateFrom: $dateFrom
      dateTo: $dateTo
      referencesOnly: $referencesOnly
      favoritesOnly: $favoritesOnly
      hiddenOnly: $hiddenOnly
      censoredOnly: $censoredOnly
      includeCensored: $includeCensored
      includeShelves: $includeShelves
      excludeShelves: $excludeShelves
      demoName: $demoName
      demosOnly: $demosOnly
      oldestFirst: $oldestFirst
      shuffleSeed: $shuffleSeed
      mood: $mood
      excludeMood: $excludeMood
      delivery: $delivery
      excludeDelivery: $excludeDelivery
      songRole: $songRole
      excludeSongRole: $excludeSongRole
      readiness: $readiness
      excludeReadiness: $excludeReadiness
      energy: $energy
      excludeEnergy: $excludeEnergy
    )
  }
`;

export const LYRICS_BY_IDS = gql`
  ${LYRIC_LIST_FIELDS}
  query LyricsByIds($ids: [Int!]!) {
    lyricsByIds(ids: $ids) {
      ...LyricListFields
    }
  }
`;

export const CAROUSEL_HISTORIES = gql`
  ${CAROUSEL_HISTORY_FIELDS}
  query CarouselHistories {
    carouselHistories {
      ...CarouselHistoryFields
    }
  }
`;

export const SAVE_CAROUSEL_HISTORY = gql`
  ${CAROUSEL_HISTORY_FIELDS}
  mutation SaveCarouselHistory(
    $lyricIds: [Int!]!
    $source: CarouselHistorySource!
  ) {
    saveCarouselHistory(lyricIds: $lyricIds, source: $source) {
      ...CarouselHistoryFields
    }
  }
`;

export const LIKE_CAROUSEL_HISTORY = gql`
  ${CAROUSEL_HISTORY_FIELDS}
  mutation LikeCarouselHistory($id: Int!) {
    likeCarouselHistory(id: $id) {
      ...CarouselHistoryFields
    }
  }
`;

export const UNLIKE_CAROUSEL_HISTORY = gql`
  mutation UnlikeCarouselHistory($id: Int!) {
    unlikeCarouselHistory(id: $id)
  }
`;

export const DELETE_CAROUSEL_HISTORY = gql`
  mutation DeleteCarouselHistory($id: Int!) {
    deleteCarouselHistory(id: $id)
  }
`;
