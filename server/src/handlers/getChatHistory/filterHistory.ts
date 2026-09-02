import { Message } from '@mtcute/core';

// TYPES
import { ILyric } from '../../types/lyric';
// HANDLERS
import {
  handlerCountParagraphs,
  handlerCountReactions,
  handlerCountWords,
  handlerWithoutHashtags,
  hashtagStringsOnly,
} from '../handlers';
// OBJECTS
import messageObject from './objMessage';

// Создаем массив с нужными данными из полученной Data
const filterHistory = (data: Message[]): ILyric[] | false => {
  // Убираем из полученной истории чата системные сообщения
  const filterData = data.filter((message) => {
    return message.action === null;
  });

  // Создаем новый массив из отфильтрованного исходника
  try {
    const chatHistory: ILyric[] = filterData.map((message) => {
      return messageObject({
        message,
        handlerCountParagraphs,
        handlerCountWords,
        handlerCountReactions,
        handlerWithoutHashtags,
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

export { filterHistory };
