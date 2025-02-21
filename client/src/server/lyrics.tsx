import { gql } from '@apollo/client'

export const ALL_LYRICS = gql`
  query AllLyrics {
    lyrics {
      id

      lyric_id
      date
      editDate
      isPinned
      isChannelPost
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
`
