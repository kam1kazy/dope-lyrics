import type { Message } from '@mtcute/core';

import { prisma } from '~/infrastructure/prisma';
import { lyricsService } from '~/modules/lyrics/lyrics.service';
import { filterHistory } from '~/modules/lyrics/parse/filter-history';
import { lyricToHistoryItem } from '~/modules/lyrics/persist/lyric-to-history-item';
import { withIngestLock } from '~/mtcute/ingest-http';

/**
 * Новый пост в привязанном канале → запись в каталог владельца привязки (TELEGRAM).
 */
export const ingestChannelPost = async (msg: Message): Promise<void> => {
  if (!msg.isChannelPost) {
    return;
  }

  if (msg.action !== null) {
    return;
  }

  const channelId = BigInt(msg.chat.id);
  const binding = await prisma.channelBinding.findUnique({
    where: { channelId },
    select: { userId: true },
  });

  if (!binding) {
    return;
  }

  const mapped = filterHistory([msg]);
  if (!mapped || mapped.length === 0) {
    return;
  }

  const record = lyricToHistoryItem(mapped[0]!);
  if (!record) {
    return;
  }

  const loaded = await withIngestLock(() =>
    lyricsService.loadNewRecords(binding.userId, [record])
  );
  if (loaded > 0) {
    console.log(
      `MTCUTE: 📥 Канал ${channelId.toString()} → user ${binding.userId}, +${loaded}`
    );
  }
};
