import { BotKeyboard, InputMedia, thtml } from '@mtcute/bun';
import {
  CallbackDataBuilder,
  CallbackQueryContext,
  filters,
  MessageContext,
} from '@mtcute/dispatcher';

import {
  formatAppleNotesImportSummary,
  importAppleNotesFromFiles,
} from '~/modules/lyrics/import/apple-notes-import';
import { usersService } from '~/modules/users/users.service';
import {
  buildAppleNotesExportScript,
  DEFAULT_NOTES_FOLDER_PATH,
  parseNotesFolderPath,
} from '~/mtcute/apple-notes/build-export-script';
import {
  extractAppleNotesFromZip,
  MAX_APPLE_NOTES_ZIP_BYTES,
} from '~/mtcute/apple-notes/extract-zip';
import { assertPermission } from '~/mtcute/guards/assert-admin';
import type { TypeBotClient } from '~/mtcute/types';

const PENDING_TTL_MS = 30 * 60 * 1000;
const PATH_AWAIT_TTL_MS = 10 * 60 * 1000;

export const NotesButton = new CallbackDataBuilder('notes', 'action');

type PendingZip = {
  expiresAt: number;
};

type PendingPath = {
  expiresAt: number;
};

type NotesSettings = {
  folderPath: string;
};

/** Ожидание zip / путь / настройки — по Telegram id отправителя. */
const pendingZipByTelegramId = new Map<number, PendingZip>();
const pendingPathByTelegramId = new Map<number, PendingPath>();
const settingsByTelegramId = new Map<number, NotesSettings>();

const telegramIdFromMessage = (msg: MessageContext): number =>
  Number(msg.sender?.id);

const telegramIdFromCallback = (query: CallbackQueryContext): number =>
  Number(query.user?.id);

const getFolderPath = (telegramId: number): string =>
  settingsByTelegramId.get(telegramId)?.folderPath ?? DEFAULT_NOTES_FOLDER_PATH;

const saveFolderPath = (telegramId: number, rawPath: string): string => {
  const normalized = parseNotesFolderPath(rawPath).join('/');
  settingsByTelegramId.set(telegramId, { folderPath: normalized });
  return normalized;
};

export const clearAppleNotesPending = (telegramId: number) => {
  pendingZipByTelegramId.delete(telegramId);
};

export const setAppleNotesPending = (telegramId: number) => {
  pendingZipByTelegramId.set(telegramId, {
    expiresAt: Date.now() + PENDING_TTL_MS,
  });
};

export const hasAppleNotesPending = (telegramId: number): boolean => {
  const pending = pendingZipByTelegramId.get(telegramId);
  if (!pending) {
    return false;
  }

  if (pending.expiresAt < Date.now()) {
    pendingZipByTelegramId.delete(telegramId);
    return false;
  }

  return true;
};

const clearPathAwait = (telegramId: number) => {
  pendingPathByTelegramId.delete(telegramId);
};

const setPathAwait = (telegramId: number) => {
  pendingPathByTelegramId.set(telegramId, {
    expiresAt: Date.now() + PATH_AWAIT_TTL_MS,
  });
};

export const hasPathAwait = (telegramId: number): boolean => {
  const pending = pendingPathByTelegramId.get(telegramId);
  if (!pending) {
    return false;
  }

  if (pending.expiresAt < Date.now()) {
    pendingPathByTelegramId.delete(telegramId);
    return false;
  }

  return true;
};

const notesKeyboard = () =>
  BotKeyboard.inline([
    [
      BotKeyboard.callback('📖 FAQ', NotesButton.build({ action: 'faq' })),
      BotKeyboard.callback(
        '⚙️ Настройки',
        NotesButton.build({ action: 'settings' })
      ),
    ],
    [
      BotKeyboard.callback(
        '📜 Скрипт',
        NotesButton.build({ action: 'script' })
      ),
      BotKeyboard.callback(
        '📦 Загрузить',
        NotesButton.build({ action: 'upload' })
      ),
    ],
  ]);

const cancelKeyboard = () =>
  BotKeyboard.inline([
    [
      BotKeyboard.callback(
        '❌ Отмена',
        NotesButton.build({ action: 'cancel' })
      ),
    ],
  ]);

const cancelAwaiting = (telegramId: number) => {
  clearAppleNotesPending(telegramId);
  clearPathAwait(telegramId);
};

const menuText = (telegramId: number) => {
  const path = getFolderPath(telegramId);
  return thtml`🍎 <b>Apple Notes</b>

Текущий путь в Notes: <code>${path}</code>
Выход экспорта на Mac: <code>Desktop/Dope Notes Export</code>

Выбери действие:`;
};

const faqText = () =>
  thtml`📖 <b>FAQ · импорт Apple Notes</b>

<b>Зачем это</b>
Выгружаешь папку из Notes на Mac → сжимаешь в zip → кидаешь боту. В каталог попадают тексты с источником <code>APPLE_NOTES</code> и датами из шапки файла. Импорт пишется <b>только в твой</b> каталог.

<b>Как пользоваться</b>
1️⃣ <b>Настройки</b> — укажи путь папки внутри Notes через <code>/</code>
   например: <code>Музыка/Рэпчик</code>
2️⃣ <b>Скрипт</b> — скачай <code>.applescript</code> и запусти на Mac
   (двойной клик / Script Editor → Run; разреши доступ к Notes)
3️⃣ На Рабочем столе появится папка <b>Dope Notes Export</b> с <code>.txt</code>
4️⃣ Сожми эту папку в <b>zip</b>
5️⃣ В боте нажми <b>Загрузить</b> и пришли zip (до 40 МБ, ~30 мин)

<b>Канал Telegram</b>
<code>/channel bind</code> — новые посты канала в твой каталог.
Историю бот <b>не читает</b>: попадут только посты после привязки. Старый корпус — через Notes или экспорт.

<b>Доступ</b>
Каталог по приглашению: автор присылает ссылку из <code>/invite</code>, она срабатывает один раз.

<b>Повторный импорт</b>
Те же тексты не плодятся. Если в YAML обновились даты — они подтянутся.

<b>Отмена</b>
кнопка <b>Отмена</b> или <code>/notes cancel</code> — сбросить ожидание zip и ввод пути.`;

const sendScript = async ({
  tg,
  chatId,
  telegramId,
}: {
  tg: TypeBotClient;
  chatId: number;
  telegramId: number;
}) => {
  const folderPath = getFolderPath(telegramId);
  const built = buildAppleNotesExportScript(folderPath);
  const fileName = 'dope-notes-export.applescript';
  const scriptBytes = Buffer.from(built.script, 'utf8');

  await tg.sendMedia(
    chatId,
    InputMedia.document(scriptBytes, {
      fileName,
      caption: thtml`📜 <b>Скрипт экспорта</b>

Папка Notes: <b>${built.folderLabel}</b>
На Mac: <code>~/${built.outputFolderLabel}</code>

Скачай и запусти на Mac → потом zip папки → кнопка <b>Загрузить</b>`,
    })
  );
};

export const commandAppleNotes = async ({
  tg,
  msg,
}: {
  tg: TypeBotClient;
  msg: filters.Modify<MessageContext, { command: string[] }>;
}) => {
  await assertPermission({
    tg,
    msg,
    permission: 'notes:import',
    action: async () => {
      const telegramId = telegramIdFromMessage(msg);
      const arg = msg.command
        .slice(1)
        .map((part) => part.trim())
        .filter(Boolean)
        .join(' ');

      if (arg.toLowerCase() === 'cancel') {
        cancelAwaiting(telegramId);
        await tg.sendText(msg.chat.id, 'Ожидание zip и ввод пути отменены.', {
          replyMarkup: notesKeyboard(),
        });
        return;
      }

      if (arg) {
        try {
          saveFolderPath(telegramId, arg);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Некорректный путь папки';
          await tg.sendText(msg.chat.id, `❌ ${message}`);
          return;
        }
      }

      await tg.sendText(msg.chat.id, menuText(telegramId), {
        replyMarkup: notesKeyboard(),
      });
    },
  });
};

export const handleNotesCallback = async ({
  tg,
  query,
}: {
  tg: TypeBotClient;
  query: CallbackQueryContext;
}): Promise<boolean> => {
  if (!query.data) {
    return false;
  }

  const data = NotesButton.parse(Buffer.from(query.data).toString());
  if (!data) {
    return false;
  }

  const chatId = query.chat.id;
  if (!chatId) {
    await query.answer({ text: '❌ Чат не найден', alert: true });
    return true;
  }

  await assertPermission({
    tg,
    msg: query as never,
    msgCallback: query,
    permission: 'notes:import',
    action: async () => {
      const telegramId = telegramIdFromCallback(query);
      const action = data.action;

      switch (action) {
        case 'faq': {
          await query.answer({ text: 'FAQ' });
          await tg.sendText(chatId, faqText());
          break;
        }

        case 'settings': {
          await query.answer({ text: 'Настройки' });
          setPathAwait(telegramId);
          clearAppleNotesPending(telegramId);
          await tg.sendText(
            chatId,
            thtml`⚙️ <b>Путь папки в Notes</b>

Пришли путь сегментами через <code>/</code>.
Сейчас: <code>${getFolderPath(telegramId)}</code>

Пример: <code>Музыка/Рэпчик</code>`,
            { replyMarkup: cancelKeyboard() }
          );
          break;
        }

        case 'script': {
          await query.answer({ text: 'Отправляю скрипт…' });
          try {
            await sendScript({ tg, chatId, telegramId });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Ошибка скрипта';
            await tg.sendText(chatId, `❌ ${message}`);
          }
          break;
        }

        case 'upload': {
          await query.answer({ text: 'Жду zip' });
          clearPathAwait(telegramId);
          setAppleNotesPending(telegramId);
          await tg.sendText(
            chatId,
            thtml`📦 <b>Жду zip</b> с экспортом

Папка на Mac: <code>Desktop/Dope Notes Export</code>
Лимит: <b>40 МБ</b>, окно: <b>30 мин</b>`,
            { replyMarkup: cancelKeyboard() }
          );
          break;
        }

        case 'cancel': {
          cancelAwaiting(telegramId);
          await query.answer({ text: 'Отменено' });
          await tg.sendText(chatId, 'Ожидание zip и ввод пути отменены.', {
            replyMarkup: notesKeyboard(),
          });
          break;
        }

        default:
          await query.answer({ text: 'Неизвестная кнопка', alert: true });
      }
    },
  });

  return true;
};

export const handleAppleNotesPathText = async ({
  tg,
  msg,
}: {
  tg: TypeBotClient;
  msg: MessageContext;
}): Promise<boolean> => {
  const telegramId = telegramIdFromMessage(msg);
  if (!hasPathAwait(telegramId)) {
    return false;
  }

  const text = msg.text?.trim() ?? '';
  if (!text || text.startsWith('/')) {
    return false;
  }

  await assertPermission({
    tg,
    msg: msg as filters.Modify<MessageContext, { command: string[] }>,
    permission: 'notes:import',
    action: async () => {
      try {
        const normalized = saveFolderPath(telegramId, text);
        clearPathAwait(telegramId);
        await tg.sendText(
          msg.chat.id,
          thtml`✅ Путь сохранён: <code>${normalized}</code>

Дальше: <b>Скрипт</b> → экспорт на Mac → <b>Загрузить</b>`,
          { replyMarkup: notesKeyboard() }
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Некорректный путь';
        await tg.sendText(msg.chat.id, `❌ ${message}\nПопробуй ещё раз.`);
      }
    },
  });

  return true;
};

export const handleAppleNotesZipDocument = async ({
  tg,
  msg,
}: {
  tg: TypeBotClient;
  msg: MessageContext;
}): Promise<boolean> => {
  const telegramId = telegramIdFromMessage(msg);
  if (!hasAppleNotesPending(telegramId)) {
    return false;
  }

  if (msg.media?.type !== 'document') {
    return false;
  }

  const fileName = msg.media.fileName?.toLowerCase() ?? '';
  const isZip =
    fileName.endsWith('.zip') || msg.media.mimeType === 'application/zip';

  if (!isZip) {
    await tg.sendText(msg.chat.id, thtml`Жду <b>zip</b>-архив с экспортом.`, {
      replyMarkup: cancelKeyboard(),
    });
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
    const catalogUser = await usersService.findByTelegramId(telegramId);
    if (!catalogUser) {
      await tg.sendText(
        msg.chat.id,
        'Доступ по приглашению — попросите ссылку у автора каталога'
      );
      return true;
    }
    const result = await importAppleNotesFromFiles(catalogUser.id, files);
    clearAppleNotesPending(telegramId);

    await tg.sendText(
      msg.chat.id,
      thtml`✅ <b>Импорт Apple Notes</b>

${formatAppleNotesImportSummary(result)}`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Неизвестная ошибка импорта';
    await tg.sendText(msg.chat.id, `❌ ${message}`);
  }

  return true;
};
