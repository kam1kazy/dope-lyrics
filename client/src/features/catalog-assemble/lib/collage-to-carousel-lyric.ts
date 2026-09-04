import type { ILyric, ILyricCollage } from '@/entities/lyric';

import { collageCarouselText } from './generator-text';

export function collageToCarouselLyric(
  collage: ILyricCollage,
  hideAdlibs: boolean
): ILyric | null {
  const text = collageCarouselText(collage.slots, hideAdlibs).trim();
  if (!text) {
    return null;
  }

  const createdAt = new Date(collage.createdAt);

  return {
    id: -collage.id,
    userId: 0,
    message: {
      message_id: 0,
      text,
    },
    user: null,
    chat: null,
    date: createdAt,
    editDate: createdAt,
    isPinned: false,
    isChannelPost: false,
    isReference: false,
    isHidden: false,
    isFavorite: false,
    isCensored: false,
    isDonor: false,
    mood: [],
    delivery: [],
    songRole: [],
    roleProfiles: [],
    readiness: null,
    replyToMessage: null,
    media: null,
  };
}
