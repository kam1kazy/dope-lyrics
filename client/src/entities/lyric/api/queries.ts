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

export const ALL_LYRICS = gql`
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
  ) {
    updateLyricFlags(
      id: $id
      isHidden: $isHidden
      isFavorite: $isFavorite
      isReference: $isReference
      isCensored: $isCensored
    ) {
      id
      lyric_id
      isReference
      isHidden
      isFavorite
      isCensored
    }
  }
`;
