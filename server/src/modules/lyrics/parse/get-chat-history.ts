import type { ILyric } from '~/modules/lyrics/lyrics.types';
import { createJsonData } from '~/modules/lyrics/parse/create-json-data';
import { filterHistory } from '~/modules/lyrics/parse/filter-history';
import type { TypeBotClient } from '~/mtcute/types';

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

  while (true) {
    try {
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
      const waitSeconds = floodWaitSeconds(error);
      if (waitSeconds !== null) {
        console.log(
          `MTCUTE: ⏳ Ожидание ${waitSeconds} секунд из-за ограничения API...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
        continue;
      }

      console.error(
        '\nMTCUTE: 🛑 Ошибка при получении истории сообщений:\n\n',
        error
      );
      break;
    }
  }

  if (data.length) {
    console.log(`MTCUTE: 📥 История чата получена (${data.length} сообщений)`);
    createJsonData(data);
    return true;
  }

  return false;
}
