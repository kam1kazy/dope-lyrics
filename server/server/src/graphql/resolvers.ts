export const resolvers = {
  Query: {
    lyrics: () => {
      return [
        {
          id: 1,
          text: 'Привет, мир!',
          is_reaction: false,
          paragraph_count: 1,
          word_count: 3,
          hashtag_count: 0,
          hashtags: [],
        },
      ]
    },
  },
}
