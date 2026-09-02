// HANDLERS
// TYPES
import { TypeBotClient } from '../../mtcute/index';
import { ILyric } from '../../types/lyric';
import { createJSONdata } from './createJSONdata';
import { filterHistory } from './filterHistory';

const floodWaitSeconds = (error: unknown): number | null => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  if (error.code !== 420) {
    return null;
  }

  if ('seconds' in error && typeof error.seconds === 'number') {
    return error.seconds;
  }

  return 30;
};

// Получаем историю чата
export async function getChatHistory({
  tg,
  chatId,
}: {
  tg: TypeBotClient;
  chatId: number;
}) {
  const params = {
    limit: 100,
    offset: {
      id: 0,
      date: Math.floor(Date.now() / 1000),
    },
  };

  const data: ILyric[] = [];
  let totalMessages = 0;

  console.log('MTCUTE: 🧻 Получаем историю чата...');

  // Пошаговый парсинг
  while (true) {
    try {
      // Делаем паузу перед каждым запросом
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const history = await tg.getHistory(chatId, {
        limit: params.limit,
        offset: params.offset,
      });

      let chatData: ILyric[] | false = [];

      if (history.length > 0) {
        chatData = filterHistory(history);
      } else {
        console.log('MTCUTE: Достигнут конец истории');
        break;
      }

      if (chatData) {
        data.push(...chatData);
      }

      if (history.length < params.limit) {
        console.log('MTCUTE: Всего собрано сообщений:', data.length);
        console.log(
          'MTCUTE: Убрано системных сообщений:',
          totalMessages - data.length,
          ' \n'
        );
        break;
      }

      if (history.length > totalMessages) {
        totalMessages = history[history.length - 1].id;
      }

      params.offset = {
        id: history[history.length - 1].id,
        date: history[history.length - 1].date.getTime(),
      };
    } catch (error: unknown) {
      // Обработка FLOOD_WAIT
      const waitSeconds = floodWaitSeconds(error);
      if (waitSeconds !== null) {
        console.log(
          `MTCUTE: ⏳ Ожидание ${waitSeconds} секунд из-за ограничения API...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
        continue; // Повторяем попытку после ожидания
      }

      console.error(
        '\nMTCUTE: 🛑 Ошибка при получении истории сообщений:\n\n',
        error
      );
      break;
    }
  }

  // Создаем файл с полученной базой
  if (data.length) {
    console.log(`MTCUTE: 📥 История чата получена (${data.length} сообщений)`);
    createJSONdata(data);
    return true;
  }

  return false;
}
