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
    $demoName: String
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
      demoName: $demoName
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

export const UPDATE_LYRIC_FLAGS = gql`
  mutation UpdateLyricFlags(
    $id: Int!
    $isHidden: Boolean
    $isFavorite: Boolean
    $isReference: Boolean
  ) {
    updateLyricFlags(
      id: $id
      isHidden: $isHidden
      isFavorite: $isFavorite
      isReference: $isReference
    ) {
      id
      lyric_id
      isReference
      isHidden
      isFavorite
    }
  }
`;
