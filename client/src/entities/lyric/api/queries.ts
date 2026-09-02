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
    $demoName: String
    $demosOnly: Boolean
    $limit: Int
    $offset: Int
    $oldestFirst: Boolean
    $mood: [LyricMood!]
    $delivery: [LyricDelivery!]
    $songRole: [LyricSongRole!]
    $readiness: LyricReadiness
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
      demoName: $demoName
      demosOnly: $demosOnly
      limit: $limit
      offset: $offset
      oldestFirst: $oldestFirst
      mood: $mood
      delivery: $delivery
      songRole: $songRole
      readiness: $readiness
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
