import { user } from './../../../prisma/data'
export const typeDefinitions = /* GraphQL */ `
  # Users
  type User {
    id: Int!
    email: String
    password: String
    name: String
  }

  # Hashtag
  type Hashtag {
    id: Int!
    text: String!
    userId: Int
    lyricId: Int
  }

  # Lyrics
  type Lyrics {
    id: Int!
    text: String!
    is_reaction: Boolean
    paragraph_count: Int
    word_count: Int
    hashtag_count: Int
    hashtags: [Int]
    userId: Int!
  }

  type Query {
    lyrics: [Lyrics!]!
    hashtags: [Hashtag]
    user: [User]
  }
`
