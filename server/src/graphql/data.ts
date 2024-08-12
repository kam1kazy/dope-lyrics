import { LyricType } from './../types/lyrics'

export const lyrics: LyricType[] = [
  {
    id: 1,
    text: 'Привет, мир!',
    is_reaction: false,
    paragraph_count: 1,
    word_count: 3,
    hashtag_count: 0,
    hashtags: [],
  },
  {
    id: 2,
    text: 'Я бог\n\nЯ бог\n\nЯ бог\n\nЯ бог\n\nЯ бог\n\nЯ бог',
    is_reaction: false,
    paragraph_count: 4,
    word_count: 14,
    hashtag_count: 0,
    hashtags: [],
  },
  {
    id: 3,
    text: 'Король Кинг (feat. The Weeknd)\n\nКороль Кинг (feat. The Weeknd)\n\nКороль Кинг (feat. The Weeknd)\n\nКороль Кинг (feat. The Weeknd)',
    is_reaction: true,
    paragraph_count: 1,
    word_count: 16,
    hashtag_count: 1,
    hashtags: ['Король Кинг'],
  },
  {
    id: 4,
    text: 'Любимый мой зверь (feat. Крис Браун)\n\nЛюбимый мой зверь (feat. Крис Браун)\n\nЛюбимый мой зверь (feat. Крис Браун)\n\nЛюбимый мой зверь (feat. Крис Браун)',
    is_reaction: false,
    paragraph_count: 3,
    word_count: 24,
    hashtag_count: 1,
    hashtags: ['Любимый мой зверь'],
  },
]
