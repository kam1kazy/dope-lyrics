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
    $demosOnly: Boolean
  ) {
    lyrics(
      tags: $tags
      keyword: $keyword
      emojis: $emojis
      dateFrom: $dateFrom
      dateTo: $dateTo
      demosOnly: $demosOnly
    ) {
      id

      lyric_id
      date
      editDate
      isPinned
      isChannelPost
      isReference
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
