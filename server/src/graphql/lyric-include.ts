export const lyricInclude = {
  message: {
    include: {
      reactions: {
        include: {
          emojis: true,
        },
      },
      hashtags: true,
    },
  },
  user: true,
  chat: true,
  media: true,
} as const;
