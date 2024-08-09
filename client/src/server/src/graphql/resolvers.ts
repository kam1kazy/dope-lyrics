import { Lyric } from '../types/lyrics'

export const resolvers = {
  Query: {
    lyrics: (_parent: unknown, _args: unknown, context: { lyrics: Lyric[] }): Lyric[] => {
      return context.lyrics
    },
  },
}
