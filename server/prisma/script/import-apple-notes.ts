import fs from 'fs';
import path from 'path';

import type { UserRole } from '~/generated/prisma/client';
import { prisma } from '~/infrastructure/prisma';
import {
  type AppleNoteInputFile,
  formatAppleNotesImportSummary,
  importAppleNotesFromFiles,
} from '~/modules/lyrics/import/apple-notes-import';
import { usersService } from '~/modules/users/users.service';

const DEFAULT_EXPORT_DIR = path.resolve(
  __dirname,
  '../../../scripts/apple note export/Рэпчик Export'
);

const ROLES = new Set<string>(['OWNER', 'ADMIN', 'USER']);

type CliArgs = {
  exportDir: string;
  ownerRef: string;
};

const parseCliArgs = (argv: string[]): CliArgs => {
  let exportDir = DEFAULT_EXPORT_DIR;
  let ownerRef = 'OWNER';

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === undefined) {
      continue;
    }

    if (arg === '--owner') {
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        ownerRef = next;
        i += 1;
      }
      continue;
    }

    if (arg.startsWith('--owner=')) {
      ownerRef = arg.slice('--owner='.length) || 'OWNER';
      continue;
    }

    if (!arg.startsWith('-')) {
      exportDir = path.resolve(arg);
    }
  }

  return { exportDir, ownerRef };
};

const resolveCatalogOwner = async (ownerRef: string) => {
  const trimmed = ownerRef.trim();
  if (ROLES.has(trimmed)) {
    const byRole = await prisma.users.findFirst({
      where: { role: trimmed as UserRole },
      orderBy: { id: 'asc' },
    });
    if (!byRole) {
      throw new Error(`Пользователь с ролью ${trimmed} не найден`);
    }
    return byRole;
  }

  const asId = Number.parseInt(trimmed, 10);
  if (Number.isFinite(asId) && asId > 0 && String(asId) === trimmed) {
    const byId = await prisma.users.findUnique({ where: { id: asId } });
    if (!byId) {
      throw new Error(`Пользователь id=${asId} не найден`);
    }
    return byId;
  }

  throw new Error(
    `Некорректный --owner: ожидается OWNER|ADMIN|USER или числовой id (получено «${ownerRef}»)`
  );
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

const importAppleNotesDir = async (exportDir: string, ownerRef: string) => {
  console.log(`\nPRISMA: 🍎 Импорт Apple Notes из ${exportDir}`);

  const files = readDirAsInputs(exportDir);
  console.log(`PRISMA: 📝 Файлов в экспорте: ${files.length}`);

  const owner =
    ownerRef === 'OWNER'
      ? await usersService.ensureOwner()
      : await resolveCatalogOwner(ownerRef);
  console.log(
    `PRISMA: 🤰 Каталог userId=${owner.id}, role=${owner.role}, --owner=${ownerRef}`
  );

  const result = await importAppleNotesFromFiles(owner.id, files);

  console.log(
    `PRISMA: ⏭️ Пропущено: дубли ${result.skippedDup}, пустые ${result.skippedEmpty}, имя ${result.skippedBadName}, неоднозначный текст ${result.skippedAmbiguous}`
  );
  console.log(
    `PRISMA: 📥 К загрузке: ${result.pendingCreate + result.pendingDateUpdate}`
  );
  console.log(`PRISMA: 📊 ${formatAppleNotesImportSummary(result)}`);
};

const main = async () => {
  const { exportDir, ownerRef } = parseCliArgs(process.argv.slice(2));

  try {
    await importAppleNotesDir(exportDir, ownerRef);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error) => {
  console.error('PRISMA: ❌ Импорт Apple Notes упал:', error);
  process.exit(1);
});
