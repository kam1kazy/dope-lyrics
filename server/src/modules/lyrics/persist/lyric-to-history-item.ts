import type { IChatHistoryItem, ILyric } from '~/modules/lyrics/lyrics.types';

export function lyricToHistoryItem(item: ILyric): IChatHistoryItem | null {
  if (!item.message || !item.user || !item.chat) {
    return null;
  }

  const reactions = item.message.reactions;

  return {
    userId: item.userId,
    message: {
      text: item.message.text,
      message_id: item.message.message_id,
      word_count: item.message.word_count ?? 0,
      paragraph_count: item.message.paragraph_count ?? 0,
      reactions: reactions
        ? {
            emojis: (reactions.emojis ?? []).flatMap((emoji) => {
              if (typeof emoji.emoji !== 'string') {
                return [];
              }

              return [
                {
                  emoji: emoji.emoji,
                  isPaid: emoji.isPaid,
                  count: emoji.count,
                  order: emoji.order ?? 0,
                },
              ];
            }),
            uniqueCount: reactions.uniqueCount,
            totalFreeCount: reactions.totalFreeCount ?? 0,
            totalPaidCount: reactions.totalPaidCount ?? 0,
            totalCount: reactions.totalCount ?? 0,
          }
        : null,
      hashtags: item.message.hashtags ?? null,
    },
    user: {
      id: item.user.id,
      username: item.user.username ?? '',
      displayName: item.user.displayName ?? item.user.username ?? '',
      isAdmin: item.user.isAdmin,
    },
    chat: {
      id: item.chat.id,
      title: item.chat.title,
      type: item.chat.type,
    },
    date: item.date,
    editDate: item.editDate,
    isPinned: item.isPinned,
    isChannelPost: item.isChannelPost,
    replyToMessage: item.replyToMessage,
    media: item.media,
  };
}
