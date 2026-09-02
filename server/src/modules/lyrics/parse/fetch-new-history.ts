import type { ILyric } from '~/modules/lyrics/lyrics.types';
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

const PAGE_SIZE = 100;

export async function fetchNewHistory({
  tg,
  chatId,
  existingIds,
}: {
  tg: TypeBotClient;
  chatId: number;
  existingIds: Set<number>;
}): Promise<ILyric[]> {
  const params = {
    limit: PAGE_SIZE,
    offset: {
      id: 0,
      date: Math.floor(Date.now() / 1000),
    },
  };

  const data: ILyric[] = [];
  let firstPage = true;

  console.log('MTCUTE: 🧻 Ищем новые сообщения…');

  while (true) {
    try {
      if (!firstPage) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      firstPage = false;

      const history = await tg.getHistory(chatId, {
        limit: params.limit,
        offset: params.offset,
      });

      if (history.length === 0) {
        break;
      }

      const filtered = filterHistory(history);
      const byId = new Map<number, ILyric>();

      if (filtered) {
        for (const item of filtered) {
          const messageId = item.message?.message_id;
          if (messageId !== undefined) {
            byId.set(messageId, item);
          }
        }
      }

      let reachedKnown = false;

      for (const message of history) {
        if (existingIds.has(message.id)) {
          reachedKnown = true;
          break;
        }

        const lyric = byId.get(message.id);
        if (lyric) {
          data.push(lyric);
        }
      }

      if (reachedKnown || history.length < params.limit) {
        break;
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
        '\nMTCUTE: 🛑 Ошибка при получении новых сообщений:\n\n',
        error
      );
      throw error;
    }
  }

  console.log(`MTCUTE: 📥 Новых сообщений: ${data.length}`);
  return data;
}
