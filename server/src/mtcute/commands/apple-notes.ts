import { InputMedia } from '@mtcute/core';
import { filters, MessageContext } from '@mtcute/dispatcher';

import {
  formatAppleNotesImportSummary,
  importAppleNotesFromFiles,
} from '~/modules/lyrics/import/apple-notes-import';
import {
  buildAppleNotesExportScript,
  DEFAULT_NOTES_FOLDER_PATH,
} from '~/mtcute/apple-notes/build-export-script';
import {
  extractAppleNotesFromZip,
  MAX_APPLE_NOTES_ZIP_BYTES,
} from '~/mtcute/apple-notes/extract-zip';
import { assertAdmin } from '~/mtcute/guards/assert-admin';
import type { TypeBotClient } from '~/mtcute/types';

const PENDING_TTL_MS = 30 * 60 * 1000;

type PendingZip = {
  expiresAt: number;
};

const pendingByAdmin = new Map<number, PendingZip>();

const adminIdFromMessage = (msg: MessageContext): number =>
  Number(msg.sender?.id);

export const clearAppleNotesPending = (adminId: number) => {
  pendingByAdmin.delete(adminId);
};

export const setAppleNotesPending = (adminId: number) => {
  pendingByAdmin.set(adminId, { expiresAt: Date.now() + PENDING_TTL_MS });
};

export const hasAppleNotesPending = (adminId: number): boolean => {
  const pending = pendingByAdmin.get(adminId);
  if (!pending) {
    return false;
  }

  if (pending.expiresAt < Date.now()) {
    pendingByAdmin.delete(adminId);
    return false;
  }

  return true;
};

const commandArgPath = (
  msg: filters.Modify<MessageContext, { command: string[] }>
): string => {
  const parts = msg.command
    .slice(1)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.join(' ');
};

export const commandAppleNotes = async ({
  tg,
  msg,
}: {
  tg: TypeBotClient;
  msg: filters.Modify<MessageContext, { command: string[] }>;
}) => {
  await assertAdmin({
    tg,
    msg,
    action: async () => {
      const adminId = adminIdFromMessage(msg);
      const arg = commandArgPath(msg);

      if (arg.toLowerCase() === 'cancel') {
        clearAppleNotesPending(adminId);
        await tg.sendText(msg.chat.id, 'Ожидание zip отменено.');
        return;
      }

      let built;

      try {
        built = buildAppleNotesExportScript(arg || undefined);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Некорректный путь папки';
        await tg.sendText(msg.chat.id, `❌ ${message}`);
        return;
      }

      const fileName = 'dope-notes-export.applescript';
      const scriptBytes = Buffer.from(built.script, 'utf8');

      setAppleNotesPending(adminId);

      await tg.sendMedia(
        msg.chat.id,
        InputMedia.document(scriptBytes, {
          fileName,
          caption: [
            `Экспорт Notes: ${built.folderLabel}`,
            `Папка на Mac: ~/${built.outputFolderLabel}`,
            '',
            '1) Скачай скрипт и запусти: osascript dope-notes-export.applescript',
            '   (или открой в Script Editor и Run; разреши доступ к Notes)',
            `2) Сожми папку «${built.outputFolderLabel.split('/').pop()}» в zip`,
            '3) Пришли этот zip сюда в течение 30 минут',
            '',
            `По умолчанию путь: ${DEFAULT_NOTES_FOLDER_PATH}`,
            'Другая папка: /notes Музыка/Другая',
            'Отмена: /notes cancel',
          ].join('\n'),
        })
      );
    },
  });
};

export const handleAppleNotesZipDocument = async ({
  tg,
  msg,
}: {
  tg: TypeBotClient;
  msg: MessageContext;
}): Promise<boolean> => {
  const adminId = adminIdFromMessage(msg);
  if (!hasAppleNotesPending(adminId)) {
    return false;
  }

  if (msg.media?.type !== 'document') {
    return false;
  }

  const fileName = msg.media.fileName?.toLowerCase() ?? '';
  const isZip =
    fileName.endsWith('.zip') || msg.media.mimeType === 'application/zip';

  if (!isZip) {
    await tg.sendText(
      msg.chat.id,
      'Жду zip-архив с экспортом (или /notes cancel).'
    );
    return true;
  }

  if (
    typeof msg.media.fileSize === 'number' &&
    msg.media.fileSize > MAX_APPLE_NOTES_ZIP_BYTES
  ) {
    await tg.sendText(
      msg.chat.id,
      `Архив больше ${MAX_APPLE_NOTES_ZIP_BYTES / (1024 * 1024)} МБ — сожми сильнее или убери лишнее.`
    );
    return true;
  }

  await tg.sendText(msg.chat.id, 'Распаковываю и импортирую…');

  try {
    const bytes = await tg.downloadAsBuffer(msg.media);
    const files = extractAppleNotesFromZip(bytes);
    const result = await importAppleNotesFromFiles(files);
    clearAppleNotesPending(adminId);

    await tg.sendText(
      msg.chat.id,
      `✅ Импорт Apple Notes\n${formatAppleNotesImportSummary(result)}`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Неизвестная ошибка импорта';
    await tg.sendText(msg.chat.id, `❌ ${message}`);
  }

  return true;
};
