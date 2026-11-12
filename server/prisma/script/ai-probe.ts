import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';

import { prisma } from '~/infrastructure/prisma';
import { isAiConfigured } from '~/modules/ai/model/polza.client';
import { FRAME_VERSION } from '~/modules/ai/rewrite/frame';
import {
  buildRewriteRequest,
  rewriteCollageRequest,
  type RewritePrompt,
} from '~/modules/ai/rewrite/rewrite.service';

const OUT_DIR = path.resolve(__dirname, '../../.ai-probe');

const USAGE = [
  'Прогон «Поправить ИИ» на лайкнутых склейках тем же запросом, что в приложении.',
  '',
  'bun run ai:probe --collage 7 --collage 8 -n 5 [--prompt файл.txt] [--theme "…"] [--label rc1] [--hide-adlibs] [--artist 3] [--text 12] [--dry]',
  '',
  '  --collage   id склейки из истории генератора, можно несколько',
  '  -n          прогонов на склейку (по умолчанию 5)',
  '  --prompt    файл с промптом вместо текущего из «Настроек ИИ»; пустой файл — без промпта',
  '  --label     метка файлов ответа (по умолчанию версия рамки)',
  '  --artist    id артиста с полки эталонов — фильтр «Артисты», можно несколько',
  '  --text      id текста с полки эталонов — фильтр «Тексты», можно несколько',
  '  --dry       только записать запрос, модель не вызывать',
  '',
  'Ответы — в server/.ai-probe/<склейка>/. Вызовы пишутся в расход как обычные.',
].join('\n');

const { values } = parseArgs({
  options: {
    collage: { type: 'string', multiple: true },
    n: { type: 'string', short: 'n', default: '5' },
    prompt: { type: 'string' },
    theme: { type: 'string' },
    label: { type: 'string' },
    'hide-adlibs': { type: 'boolean', default: false },
    artist: { type: 'string', multiple: true },
    text: { type: 'string', multiple: true },
    dry: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const collageIds = (values.collage ?? []).map(Number);
const runs = Number(values.n);
const artistIds = (values.artist ?? []).map(Number);
const textIds = (values.text ?? []).map(Number);

if (
  values.help ||
  collageIds.length === 0 ||
  [...collageIds, ...artistIds, ...textIds].some(
    (id) => !Number.isInteger(id)
  ) ||
  !Number.isInteger(runs) ||
  runs < 1
) {
  console.log(USAGE);
  process.exit(values.help ? 0 : 1);
}

if (!values.dry && !isAiConfigured()) {
  console.error('ИИ не настроен: нет ключа, адреса или модели в env сервера');
  process.exit(1);
}

const promptOverride: RewritePrompt | undefined = values.prompt
  ? { id: null, text: fs.readFileSync(values.prompt, 'utf8') }
  : undefined;
const label = values.label ?? FRAME_VERSION;

for (const collageId of collageIds) {
  const collage = await prisma.lyricCollage.findUnique({
    where: { id: collageId },
  });
  if (!collage) {
    console.error(`Склейки ${collageId} нет`);
    continue;
  }

  const request = await buildRewriteRequest(
    collage.userId,
    {
      slots: collage.slots,
      theme: values.theme ?? null,
      hideAdlibs: values['hide-adlibs'],
      references: { artistIds, textIds },
    },
    promptOverride
  );
  const dir = path.join(OUT_DIR, String(collageId));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'source.txt'), request.sourceText);
  fs.writeFileSync(
    path.join(dir, `${label}.request.txt`),
    `FRAME ${FRAME_VERSION}\n\n=== SYSTEM\n${request.system}\n\n=== USER\n${request.user}\n`
  );

  if (values.dry) {
    console.log(`склейка ${collageId}: запрос рамки ${FRAME_VERSION} → ${dir}`);
    continue;
  }

  const results = await Promise.allSettled(
    Array.from({ length: runs }, async (_, index) => {
      const { value } = await rewriteCollageRequest(collage.userId, request);
      fs.writeFileSync(path.join(dir, `${label}-${index + 1}.txt`), value);
    })
  );
  const failed = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );

  for (const result of failed) {
    const reason: unknown = result.reason;
    console.error(
      `склейка ${collageId}: ${reason instanceof Error ? reason.message : String(reason)}`
    );
  }
  console.log(
    `склейка ${collageId}: ${runs - failed.length}/${runs}, рамка ${FRAME_VERSION} → ${dir}`
  );
}

await prisma.$disconnect();
