import fs from 'fs';
import path from 'path';

import { prisma } from '~/infrastructure/prisma';
import { readinessFromLineCount } from '~/modules/lyrics/lyric-facets';
import { countParagraphs, countWords } from '~/modules/lyrics/parse/text-utils';
import { usersService } from '~/modules/users/users.service';

const DEFAULT_EXPORT_DIR = path.resolve(
  __dirname,
  '../../../scripts/apple note export/Рэпчик Export'
);

const INSERT_CONCURRENCY = 20;
const FILE_NAME_RE = /^(\d+)\s*-/;

const normalizeNoteText = (raw: string): string =>
  raw
    .replace(/\u2028/g, '\n')
    .replace(/\u2029/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim();

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

const importAppleNotes = async (exportDir: string) => {
  console.log(`\nPRISMA: 🍎 Импорт Apple Notes из ${exportDir}`);

  const owner = await usersService.ensureOwner();
  const files = listNoteFiles(exportDir);
  console.log(`PRISMA: 📝 Файлов в экспорте: ${files.length}`);

  const existing = await prisma.lyrics.findMany({
    where: { source: 'APPLE_NOTES' },
    select: { lyric_id: true },
  });
  const existingIds = new Set(existing.map((row) => row.lyric_id));

  type NoteRow = {
    lyricId: number;
    text: string;
    date: Date;
    wordCount: number;
    paragraphCount: number;
  };

  const rows: NoteRow[] = [];
  let skippedEmpty = 0;
  let skippedDup = 0;
  let skippedBadName = 0;

  for (const fileName of files) {
    const lyricId = parseLyricId(fileName);
    if (lyricId == null) {
      skippedBadName += 1;
      continue;
    }

    if (existingIds.has(lyricId)) {
      skippedDup += 1;
      continue;
    }

    const filePath = path.join(exportDir, fileName);
    const stat = fs.statSync(filePath);
    const text = normalizeNoteText(fs.readFileSync(filePath, 'utf8'));

    if (!text) {
      skippedEmpty += 1;
      continue;
    }

    rows.push({
      lyricId,
      text,
      date: stat.mtime,
      wordCount: countWords(text),
      paragraphCount: countParagraphs(text),
    });
  }

  console.log(
    `PRISMA: ⏭️ Пропущено: дубли ${skippedDup}, пустые ${skippedEmpty}, имя ${skippedBadName}`
  );
  console.log(`PRISMA: 📥 К загрузке: ${rows.length}`);

  let loaded = 0;

  for (let i = 0; i < rows.length; i += INSERT_CONCURRENCY) {
    const batch = rows.slice(i, i + INSERT_CONCURRENCY);
    await Promise.all(
      batch.map(async (row) => {
        try {
          await prisma.lyrics.create({
            data: {
              userId: owner.id,
              lyric_id: row.lyricId,
              source: 'APPLE_NOTES',
              date: row.date,
              editDate: row.date,
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

  console.log(`PRISMA: 📊 Загружено Apple Notes: ${loaded}`);
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
