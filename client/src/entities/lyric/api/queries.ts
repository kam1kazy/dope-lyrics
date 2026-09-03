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
    mood
    delivery
    songRole
    roleProfiles {
      songRole
      mood
      delivery
    }
    readiness
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
  ) {
    updateLyricProfile(
      id: $id
      mood: $mood
      delivery: $delivery
      roleProfiles: $roleProfiles
      readiness: $readiness
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
  ) {
    updateLyricFlags(
      id: $id
      isHidden: $isHidden
      isFavorite: $isFavorite
      isReference: $isReference
      isCensored: $isCensored
      isDonor: $isDonor
    ) {
      id
      lyric_id
      isReference
      isHidden
      isFavorite
      isCensored
      isDonor
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
    $preset: TrackFormPreset
    $hideAdlibs: Boolean
    $filter: LyricPoolFilter
  ) {
    assembleTrack(preset: $preset, hideAdlibs: $hideAdlibs, filter: $filter) {
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
