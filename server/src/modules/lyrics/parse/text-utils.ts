import { MessageEntity } from '@mtcute/core';

import type { IEmoji } from '~/modules/lyrics/lyrics.types';

export const countWords = (lyric: string) => {
  const words = lyric.trim().split(/\s+/);
  return Number(words.filter((word) => word.length > 0).length);
};

export const countParagraphs = (lyric: string) => {
  const paragraphs = lyric.split(/[\r\n]+/);
  return Number(
    paragraphs.filter((paragraph: string) => paragraph.trim().length > 0).length
  );
};

export const countReactions = (
  reactions: IEmoji[],
  type: 'total' | 'paid' | 'free'
) => {
  const totalCount = reactions.reduce((total: number, reaction) => {
    if (type === 'total') return total + reaction.count;
    if (type === 'paid')
      return reaction.isPaid ? total + reaction.count : total;
    if (type === 'free')
      return !reaction.isPaid ? total + reaction.count : total;

    return total;
  }, 0);

  try {
    return totalCount;
  } catch (error) {
    return console.error(
      `\nMTCUTE: 🛑 Ошибка подсчета ${type} реакций:\n\n`,
      error
    );
  }
};

export const withoutHashtags = (lyric: string) => {
  return lyric.replace(/\s*#[^\s]+/g, '').trim();
};

export const hashtagStringsOnly = (data: readonly MessageEntity[]) => {
  const hashtagStrings: string[] = data.map((hashtag) =>
    hashtag.text.replace(/^#/, '')
  );

  return hashtagStrings;
};
