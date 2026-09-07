import fs from 'fs';
import path from 'path';

import { prisma } from '~/infrastructure/prisma';
import { readinessFromLineCount } from '~/modules/lyrics/lyric-facets';
import { parseAppleNoteFile } from '~/modules/lyrics/parse/apple-note-file';
import { countParagraphs, countWords } from '~/modules/lyrics/parse/text-utils';
import { usersService } from '~/modules/users/users.service';

const DEFAULT_EXPORT_DIR = path.resolve(
  __dirname,
  '../../../scripts/apple note export/Рэпчик Export'
);

const INSERT_CONCURRENCY = 20;
const FILE_NAME_RE = /^(\d+)\s*-/;

const parseLyricId = (fileName: string): number | null => {
  const match = FILE_NAME_RE.exec(fileName);
  if (!match) {
    return null;
  }

  const id = Number.parseInt(match[1] ?? '', 10);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const listNoteFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) {
    throw new Error(`Папка экспорта не найдена: ${dir}`);
  }

  return fs
    .readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith('.txt'))
    .sort();
};

type ExistingNote = {
  id: number;
  lyricId: number;
};

const importAppleNotes = async (exportDir: string) => {
  console.log(`\nPRISMA: 🍎 Импорт Apple Notes из ${exportDir}`);

  const owner = await usersService.ensureOwner();
  const files = listNoteFiles(exportDir);
  console.log(`PRISMA: 📝 Файлов в экспорте: ${files.length}`);

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

  const rows: NoteRow[] = [];
  const seenTexts = new Set<string>();
  let skippedEmpty = 0;
  let skippedDup = 0;
  let skippedBadName = 0;
  let skippedAmbiguous = 0;

  for (const fileName of files) {
    const lyricId = parseLyricId(fileName);
    if (lyricId == null) {
      skippedBadName += 1;
      continue;
    }

    const filePath = path.join(exportDir, fileName);
    const stat = fs.statSync(filePath);
    const parsed = parseAppleNoteFile(
      fs.readFileSync(filePath, 'utf8'),
      stat.mtime
    );

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

  console.log(
    `PRISMA: ⏭️ Пропущено: дубли ${skippedDup}, пустые ${skippedEmpty}, имя ${skippedBadName}, неоднозначный текст ${skippedAmbiguous}`
  );
  console.log(`PRISMA: 📥 К загрузке: ${rows.length}`);

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

  console.log(
    `PRISMA: 📊 Загружено Apple Notes: ${loaded}; дат обновлено: ${datesUpdated}`
  );
};

const main = async () => {
  const exportDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_EXPORT_DIR;

  try {
    await importAppleNotes(exportDir);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error) => {
  console.error('PRISMA: ❌ Импорт Apple Notes упал:', error);
  process.exit(1);
});
