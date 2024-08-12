import { LyricType } from '../types/lyrics'

export const resolvers = {
  Query: {
    lyrics: (_parent: unknown, _args: unknown, context: { lyrics: LyricType[] }): LyricType[] => {
      return context.lyrics
    },
  },
}
