import { prisma } from '~/infrastructure/prisma';
import { readinessFromLineCount } from '~/modules/lyrics/lyric-facets';
import { parseAppleNoteFile } from '~/modules/lyrics/parse/apple-note-file';
import { countParagraphs, countWords } from '~/modules/lyrics/parse/text-utils';
import { usersService } from '~/modules/users/users.service';

const INSERT_CONCURRENCY = 20;
const FILE_NAME_RE = /^(\d+)\s*-/;

export type AppleNoteInputFile = {
  fileName: string;
  content: string;
  mtime: Date;
};

export type AppleNotesImportResult = {
  fileCount: number;
  loaded: number;
  datesUpdated: number;
  skippedDup: number;
  skippedEmpty: number;
  skippedBadName: number;
  skippedAmbiguous: number;
  pendingCreate: number;
  pendingDateUpdate: number;
};

type ExistingNote = {
  id: number;
  lyricId: number;
};

type NoteRow = {
  lyricId: number;
  text: string;
  date: Date;
  editDate: Date;
  wordCount: number;
  paragraphCount: number;
  existingId: number | null;
  hasMeta: boolean;
};

export const parseAppleNoteLyricId = (fileName: string): number | null => {
  const baseName = fileName.split('/').pop() ?? fileName;
  const match = FILE_NAME_RE.exec(baseName);
  if (!match) {
    return null;
  }

  const id = Number.parseInt(match[1] ?? '', 10);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const planRows = async (
  files: AppleNoteInputFile[]
): Promise<{
  rows: NoteRow[];
  skippedDup: number;
  skippedEmpty: number;
  skippedBadName: number;
  skippedAmbiguous: number;
  existingIds: Set<number>;
}> => {
  const existing = await prisma.lyrics.findMany({
    where: { source: 'APPLE_NOTES' },
    select: {
      id: true,
      lyric_id: true,
      message: { select: { text: true } },
    },
  });
  const existingIds = new Set(existing.map((row) => row.lyric_id));
  const byText = new Map<string, ExistingNote[]>();

  for (const row of existing) {
    const text = row.message?.text ?? '';
    if (!text) {
      continue;
    }

    const group = byText.get(text) ?? [];
    group.push({ id: row.id, lyricId: row.lyric_id });
    byText.set(text, group);
  }

  const rows: NoteRow[] = [];
  const seenTexts = new Set<string>();
  let skippedEmpty = 0;
  let skippedDup = 0;
  let skippedBadName = 0;
  let skippedAmbiguous = 0;

  for (const file of files) {
    const lyricId = parseAppleNoteLyricId(file.fileName);
    if (lyricId == null) {
      skippedBadName += 1;
      continue;
    }

    const parsed = parseAppleNoteFile(file.content, file.mtime);

    if (!parsed.text) {
      skippedEmpty += 1;
      continue;
    }

    if (seenTexts.has(parsed.text)) {
      skippedAmbiguous += 1;
      continue;
    }

    const matches = byText.get(parsed.text) ?? [];
    if (matches.length > 1) {
      skippedAmbiguous += 1;
      continue;
    }

    const matched = matches[0] ?? null;
    if (matched && !parsed.hasMeta) {
      skippedDup += 1;
      continue;
    }

    if (!matched && existingIds.has(lyricId)) {
      skippedDup += 1;
      continue;
    }

    seenTexts.add(parsed.text);
    rows.push({
      lyricId: matched?.lyricId ?? lyricId,
      text: parsed.text,
      date: parsed.date,
      editDate: parsed.editDate,
      wordCount: countWords(parsed.text),
      paragraphCount: countParagraphs(parsed.text),
      existingId: matched?.id ?? null,
      hasMeta: parsed.hasMeta,
    });
  }

  return {
    rows,
    skippedDup,
    skippedEmpty,
    skippedBadName,
    skippedAmbiguous,
    existingIds,
  };
};

export const importAppleNotesFromFiles = async (
  files: AppleNoteInputFile[]
): Promise<AppleNotesImportResult> => {
  const owner = await usersService.ensureOwner();
  const planned = await planRows(files);
  const {
    rows,
    skippedDup,
    skippedEmpty,
    skippedBadName,
    skippedAmbiguous,
    existingIds,
  } = planned;

  const pendingCreate = rows.filter((row) => row.existingId == null).length;
  const pendingDateUpdate = rows.filter(
    (row) => row.existingId != null && row.hasMeta
  ).length;

  let loaded = 0;
  let datesUpdated = 0;

  for (let i = 0; i < rows.length; i += INSERT_CONCURRENCY) {
    const batch = rows.slice(i, i + INSERT_CONCURRENCY);
    await Promise.all(
      batch.map(async (row) => {
        try {
          if (row.existingId != null) {
            if (!row.hasMeta) {
              return;
            }

            await prisma.lyrics.update({
              where: { id: row.existingId },
              data: {
                date: row.date,
                editDate: row.editDate,
              },
            });
            datesUpdated += 1;
            return;
          }

          await prisma.lyrics.create({
            data: {
              userId: owner.id,
              lyric_id: row.lyricId,
              source: 'APPLE_NOTES',
              date: row.date,
              editDate: row.editDate,
              isPinned: false,
              isChannelPost: false,
              readiness: readinessFromLineCount(row.paragraphCount),
              message: {
                create: {
                  message_id: row.lyricId,
                  text: row.text,
                  word_count: row.wordCount,
                  paragraph_count: row.paragraphCount,
                },
              },
            },
          });
          existingIds.add(row.lyricId);
          loaded += 1;
        } catch (error) {
          console.error(
            `PRISMA: 🚧 Apple Notes lyric_id=${row.lyricId} не загрузился\n`,
            error
          );
        }
      })
    );
  }

  return {
    fileCount: files.length,
    loaded,
    datesUpdated,
    skippedDup,
    skippedEmpty,
    skippedBadName,
    skippedAmbiguous,
    pendingCreate,
    pendingDateUpdate,
  };
};

export const formatAppleNotesImportSummary = (
  result: AppleNotesImportResult
): string => {
  return [
    `Файлов: ${result.fileCount}`,
    `Новых: ${result.loaded}`,
    `Дат обновлено: ${result.datesUpdated}`,
    `Пропущено: дубли ${result.skippedDup}, пустые ${result.skippedEmpty}, имя ${result.skippedBadName}, неоднозначные ${result.skippedAmbiguous}`,
  ].join('\n');
};
