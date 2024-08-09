export const typeDefinitions = /* GraphQL */ `
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
`
