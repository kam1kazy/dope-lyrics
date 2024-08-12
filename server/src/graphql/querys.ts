export const typeDefinitions = /* GraphQL */ `
  # Users
  type User {
    id: Int!
    email: String!
    name: String
    lyrics: [Lyrics!]!
  }

  # Lyrics
  type Lyrics {
    id: Int!
    text: String!
    is_reaction: Boolean!
    paragraph_count: Int!
    word_count: Int!
    hashtag_count: Int!
    hashtags: [String!]!
  }

  type Query {
    lyrics: [Lyrics!]!
  }

  # Hashtag
  type Hashtag {
    id: Int!
    text: String!
  }

  type LyricHashtag {
    id: Int!
    lyricID: Int!
    hashtagID: Int!
  }

  type Query {
    hashtags: [Hashtag!]!
  }
`
