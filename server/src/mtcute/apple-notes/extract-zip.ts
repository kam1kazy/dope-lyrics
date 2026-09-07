import { unzipSync } from 'fflate';

import type { AppleNoteInputFile } from '~/modules/lyrics/import/apple-notes-import';

export const MAX_APPLE_NOTES_ZIP_BYTES = 40 * 1024 * 1024;

const isTxtEntry = (name: string): boolean => {
  const base = name.split('/').pop() ?? name;
  return (
    base.toLowerCase().endsWith('.txt') &&
    !base.startsWith('.') &&
    !name.includes('__MACOSX/')
  );
};

export const extractAppleNotesFromZip = (
  zipBytes: Uint8Array
): AppleNoteInputFile[] => {
  if (zipBytes.byteLength > MAX_APPLE_NOTES_ZIP_BYTES) {
    throw new Error(
      `Архив слишком большой (лимит ${MAX_APPLE_NOTES_ZIP_BYTES / (1024 * 1024)} МБ)`
    );
  }

  let entries: Record<string, Uint8Array>;

  try {
    entries = unzipSync(zipBytes);
  } catch {
    throw new Error('Не удалось распаковать zip');
  }

  const files: AppleNoteInputFile[] = [];
  const now = new Date();

  for (const [name, data] of Object.entries(entries)) {
    if (!isTxtEntry(name)) {
      continue;
    }

    files.push({
      fileName: name.split('/').pop() ?? name,
      content: new TextDecoder('utf-8').decode(data),
      mtime: now,
    });
  }

  files.sort((left, right) => left.fileName.localeCompare(right.fileName));

  if (files.length === 0) {
    throw new Error('В архиве нет .txt заметок');
  }

  return files;
};
