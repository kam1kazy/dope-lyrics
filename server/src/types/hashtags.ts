import { LyricType } from './lyrics'

export interface HashtagType {
  id: number
  text: string
  lyrics: LyricType[]
}

export interface LyricHashtagType {
  id: number
  lyric: LyricType
  lyricID: number
  hashtag: HashtagType
  hashtagID: number
}
