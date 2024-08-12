import { HashtagType, LyricHashtagType } from '../server/src/types/hashtags'
import { LyricType } from '../server/src/types/lyrics'
import { UserType } from '../server/src/types/user'

export const lyrics: LyricType[] = [
  {
    text: 'Привет, мир!',
    is_reaction: false,
    paragraph_count: 1,
    word_count: 3,
    hashtag_count: 0,
    hashtags: [],
    userId: 1,
  },
  {
    text: 'Я бог\n\nЯ бог\n\nЯ бог\n\nЯ бог\n\nЯ бог\n\nЯ бог',
    is_reaction: false,
    paragraph_count: 4,
    word_count: 14,
    hashtag_count: 0,
    hashtags: [],
    userId: 1,
  },
  {
    text: 'Король Кинг (feat. The Weeknd)\n\nКороль Кинг (feat. The Weeknd)\n\nКороль Кинг (feat. The Weeknd)\n\nКороль Кинг (feat. The Weeknd)',
    is_reaction: true,
    paragraph_count: 1,
    word_count: 16,
    hashtag_count: 1,
    hashtags: ['Король Кинг'],
    userId: 1,
  },
  {
    text: 'Любимый мой зверь (feat. Крис Браун)\n\nЛюбимый мой зверь (feat. Крис Браун)\n\nЛюбимый мой зверь (feat. Крис Браун)\n\nЛюбимый мой зверь (feat. Крис Браун)',
    is_reaction: false,
    paragraph_count: 3,
    word_count: 24,
    hashtag_count: 1,
    hashtags: ['Любимый мой зверь'],
    userId: 1,
  },
]

export const user: UserType[] = [
  {
    id: 1,
    email: 'QsC9c@example.com',
    password: '123',
    name: 'Dope',
  },
]

export const hashtags: HashtagType[] = [
  {
    id: 1,
    text: 'Король Кинг',
    lyrics: [lyrics[2]],
  },
  {
    id: 2,
    text: 'Любимый мой зверь',
    lyrics: [lyrics[3]],
  },
]

export const lyricHashtag: LyricHashtagType[] = [
  {
    id: 1,
    lyric: lyrics[2],
    lyricID: 3,
    hashtag: hashtags[0],
    hashtagID: 1,
  },
  {
    id: 2,
    lyric: lyrics[3],
    lyricID: 4,
    hashtag: hashtags[1],
    hashtagID: 2,
  },
]
