import { HashtagType } from '../src/types/hashtags'
import { LyricType } from '../src/types/lyrics'
import { UserType } from '../src/types/user'

export const users: UserType[] = [
  {
    id: 1,
    email: 't2nda@yandex.ru',
    password: '123',
    name: 'Dope',
  },
  {
    id: 2,
    email: 'lucky@yandex.ru',
    password: 'abc',
    name: 'Lucky',
  },
  {
    id: 3,
    email: 'professor@yandex.ru',
    password: 'q2ws',
    name: 'Professor',
  },
]

export const hashtags: HashtagType[] = [
  {
    id: 1,
    text: 'Король Кинг',
    userId: 1,
    lyricId: 3,
  },
  {
    id: 2,
    text: 'Любимый мой зверь',
    userId: 1,
    lyricId: 3,
  },
]

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
    hashtags: [1],
    userId: 1,
  },
  {
    text: 'Любимый мой зверь (feat. Крис Браун)\n\nЛюбимый мой зверь (feat. Крис Браун)\n\nЛюбимый мой зверь (feat. Крис Браун)\n\nЛюбимый мой зверь (feat. Крис Браун)',
    is_reaction: false,
    paragraph_count: 3,
    word_count: 24,
    hashtag_count: 1,
    hashtags: [2],
    userId: 1,
  },
  {
    text: 'Где я? Что я тут делаю?',
    is_reaction: false,
    paragraph_count: 1,
    word_count: 5,
    hashtag_count: 0,
    hashtags: [],
    userId: 2,
  },
  {
    text: 'Опа! Я в базе - прям как дома (:',
    is_reaction: false,
    paragraph_count: 1,
    word_count: 9,
    hashtag_count: 0,
    hashtags: [],
    userId: 3,
  },
]
