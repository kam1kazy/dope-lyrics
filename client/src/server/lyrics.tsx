import { gql } from '@apollo/client'

export const ALL_LYRICS = gql`
  query AllLyrics {
    lyrics {
      id
      hashtag_count
      hashtags
      is_reaction
      paragraph_count
      text
      word_count
    }
  }
`

export const ADD_LYRIC = gql`
  mutation CreateLyric($hashtag_count: Int!, $hashtags: [String]!, $paragraph_count: Int!, $is_reaction: Boolean!, $text: String!, $word_count: Int!) {
    createLyric(hashtag_count: $hashtag_count, hashtags: $hashtags, is_reaction: $is_reaction, paragraph_count: $paragraph_count, text: $text, word_count: $word_count) {
      hashtag_count
      hashtags
      is_reaction
      paragraph_count
      text
      word_count
    }
  }
`
