import fs from 'fs';
import path from 'path';

import { prisma } from '~/infrastructure/prisma';
import {
  type AppleNoteInputFile,
  formatAppleNotesImportSummary,
  importAppleNotesFromFiles,
} from '~/modules/lyrics/import/apple-notes-import';

const DEFAULT_EXPORT_DIR = path.resolve(
  __dirname,
  '../../../scripts/apple note export/Рэпчик Export'
);

const listNoteFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) {
    throw new Error(`Папка экспорта не найдена: ${dir}`);
  }

  return fs
    .readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith('.txt'))
    .sort();
};

const readDirAsInputs = (exportDir: string): AppleNoteInputFile[] => {
  return listNoteFiles(exportDir).map((fileName) => {
    const filePath = path.join(exportDir, fileName);
    const stat = fs.statSync(filePath);

    return {
      fileName,
      content: fs.readFileSync(filePath, 'utf8'),
      mtime: stat.mtime,
    };
  });
};

const importAppleNotesDir = async (exportDir: string) => {
  console.log(`\nPRISMA: 🍎 Импорт Apple Notes из ${exportDir}`);

  const files = readDirAsInputs(exportDir);
  console.log(`PRISMA: 📝 Файлов в экспорте: ${files.length}`);

  const result = await importAppleNotesFromFiles(files);

  console.log(
    `PRISMA: ⏭️ Пропущено: дубли ${result.skippedDup}, пустые ${result.skippedEmpty}, имя ${result.skippedBadName}, неоднозначный текст ${result.skippedAmbiguous}`
  );
  console.log(
    `PRISMA: 📥 К загрузке: ${result.pendingCreate + result.pendingDateUpdate}`
  );
  console.log(`PRISMA: 📊 ${formatAppleNotesImportSummary(result)}`);
};

const main = async () => {
  const exportDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_EXPORT_DIR;

  try {
    await importAppleNotesDir(exportDir);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error) => {
  console.error('PRISMA: ❌ Импорт Apple Notes упал:', error);
  process.exit(1);
});
