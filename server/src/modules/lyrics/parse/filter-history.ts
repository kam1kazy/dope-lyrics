import { Message } from '@mtcute/core';

import type { ILyric } from '~/modules/lyrics/lyrics.types';
import { mapMessage } from '~/modules/lyrics/parse/map-message';
import {
  countParagraphs,
  countReactions,
  countWords,
  hashtagStringsOnly,
  withoutHashtags,
} from '~/modules/lyrics/parse/text-utils';

export const filterHistory = (data: Message[]): ILyric[] | false => {
  const filterData = data.filter((message) => {
    return message.action === null;
  });

  try {
    const chatHistory: ILyric[] = filterData.map((message) => {
      return mapMessage({
        message,
        handlerCountParagraphs: countParagraphs,
        handlerCountWords: countWords,
        handlerCountReactions: countReactions,
        handlerWithoutHashtags: withoutHashtags,
        hashtagStringsOnly,
      });
    });

    return chatHistory;
  } catch (error) {
    console.error(
      '\n🛑 MTCUTE: Ошибка при создании объекта chatHistory:\n\n',
      error
    );
    return false;
  }
};
