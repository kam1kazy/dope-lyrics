import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';

import { prisma } from '~/infrastructure/prisma';
import { isAiConfigured } from '~/modules/ai/model/polza.client';
import { SCRATCH_FRAME_VERSION } from '~/modules/ai/scratch/frame';
import { hasLink, scratchExcerpt } from '~/modules/ai/scratch/pick';
import {
  buildScratchRequest,
  callScratch,
  type ScratchFacetsInput,
  type ScratchOptions,
} from '~/modules/ai/scratch/scratch.service';
import {
  DEFAULT_TRACK_FORM_QUOTAS,
  type TrackFormQuotas,
} from '~/modules/lyrics/track-assemble';

const OUT_DIR = path.resolve(__dirname, '../../.ai-probe/scratch');

const USAGE = [
  'Прогон «С нуля» тем же запросом, что в приложении.',
  '',
  'bun run ai:scratch --themes themes.json [--pick | --dry] [-n 3] [--only t1] [--prompt файл.txt] [--no-references] [--artist 3] [--text 12] [--label rc1]',
  '',
  '  --themes         JSON: [{ "id": "t1", "theme": "…", "facets": { "moods": [...], "deliveries": [...], "energies": [...] }, "form"?: {...} }]',
  '  --only           id темы из файла, можно несколько',
  '  --pick           только подбор эталонов, модель не вызывать',
  '  --dry            только записать запрос, модель не вызывать',
  '  -n               прогонов на тему (по умолчанию 3)',
  '  --prompt         файл с промптом вместо текущего; пустой файл — без портрета',
  '  --no-references  без эталонов',
  '  --artist/--text  фильтр «Артисты» / «Тексты», можно несколько',
  '  --label          метка файлов (по умолчанию версия рамки)',
  '',
  'Без --pick и --dry зовёт polza — только по слову автора. Файлы — в server/.ai-probe/scratch/<тема>/.',
].join('\n');

const { values } = parseArgs({
  options: {
    themes: { type: 'string' },
    only: { type: 'string', multiple: true },
    pick: { type: 'boolean', default: false },
    dry: { type: 'boolean', default: false },
    n: { type: 'string', short: 'n', default: '3' },
    prompt: { type: 'string' },
    'no-references': { type: 'boolean', default: false },
    artist: { type: 'string', multiple: true },
    text: { type: 'string', multiple: true },
    label: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

type ProbeTheme = {
  id: string;
  theme: string;
  facets: ScratchFacetsInput;
  form: TrackFormQuotas;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

const readThemes = (file: string): ProbeTheme[] => {
  const raw: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(raw)) {
    throw new Error('Файл тем — массив');
  }

  return raw.filter(isRecord).map((item) => {
    const facets = isRecord(item.facets) ? item.facets : {};
    const form = isRecord(item.form) ? item.form : {};
    const count = (key: keyof TrackFormQuotas): number =>
      typeof form[key] === 'number'
        ? form[key]
        : DEFAULT_TRACK_FORM_QUOTAS[key];

    return {
      id: String(item.id),
      theme: String(item.theme),
      facets: {
        moods: strings(facets.moods),
        deliveries: strings(facets.deliveries),
        energies: strings(facets.energies),
      },
      form: {
        intro: count('intro'),
        verse: count('verse'),
        hook: count('hook'),
        bridge: count('bridge'),
      },
    };
  });
};

const runs = Number(values.n);
const artistIds = (values.artist ?? []).map(Number);
const textIds = (values.text ?? []).map(Number);

if (
  values.help ||
  !values.themes ||
  [...artistIds, ...textIds].some((id) => !Number.isInteger(id)) ||
  !Number.isInteger(runs) ||
  runs < 1
) {
  console.log(USAGE);
  process.exit(values.help ? 0 : 1);
}

const callsModel = !values.pick && !values.dry;
if (callsModel && !isAiConfigured()) {
  console.error('ИИ не настроен: нет ключа, адреса или модели в env сервера');
  process.exit(1);
}

const owner = await prisma.users.findFirst({
  where: { role: 'OWNER' },
  orderBy: { id: 'asc' },
  select: { id: true },
});
if (!owner) {
  console.error('Нет пользователя с ролью OWNER');
  process.exit(1);
}

const only = new Set(values.only ?? []);
const themes = readThemes(values.themes).filter(
  (item) => only.size === 0 || only.has(item.id)
);
const options: ScratchOptions = {
  noReferences: values['no-references'],
  prompt: values.prompt
    ? { id: null, text: fs.readFileSync(values.prompt, 'utf8') }
    : undefined,
};
const label = values.label ?? SCRATCH_FRAME_VERSION;

for (const item of themes) {
  const dir = path.join(OUT_DIR, item.id);
  fs.mkdirSync(dir, { recursive: true });
  const input = {
    theme: item.theme,
    form: item.form,
    facets: item.facets,
    references: { artistIds, textIds },
  };

  if (values.pick) {
    const report: string[] = [`=== ${item.id}: ${item.theme}`];
    for (let run = 1; run <= runs; run += 1) {
      const request = await buildScratchRequest(owner.id, input, options);
      report.push(`  прогон ${run}`);
      for (const { artistName, sample } of request.references) {
        const excerpt = scratchExcerpt(sample.text);
        report.push(
          `    ${artistName} — «${sample.title ?? '—'}» [${sample.mood.join('+')}/${sample.delivery.join('+')}/${sample.energy ?? '—'}]${hasLink(excerpt) ? ' · СВЯЗЬ' : ''}`,
          `      ${excerpt.split('\n').slice(0, 2).join(' / ')}`
        );
      }
    }
    fs.writeFileSync(path.join(dir, `${label}.pick.txt`), report.join('\n'));
    console.log(report.join('\n'));
    continue;
  }

  const request = await buildScratchRequest(owner.id, input, options);
  const head = request.references
    .map(({ artistName, sample }) => `${artistName} — «${sample.title ?? '—'}»`)
    .join('; ');
  fs.writeFileSync(
    path.join(dir, `${label}.request.txt`),
    `FRAME ${SCRATCH_FRAME_VERSION}\nЭТАЛОНЫ ${head || '—'}\n\n=== SYSTEM\n${request.system}\n\n=== USER\n${request.user}\n`
  );

  if (values.dry) {
    console.log(`${item.id}: запрос рамки ${SCRATCH_FRAME_VERSION} → ${dir}`);
    continue;
  }

  const results = await Promise.allSettled(
    Array.from({ length: runs }, async (_, index) => {
      const fresh =
        index === 0
          ? request
          : await buildScratchRequest(owner.id, input, options);
      const { value } = await callScratch(owner.id, fresh);
      const refs = fresh.references
        .map(
          ({ artistName, sample }) => `${artistName} — «${sample.title ?? '—'}»`
        )
        .join('; ');
      fs.writeFileSync(
        path.join(dir, `${label}-${index + 1}.txt`),
        `ЭТАЛОНЫ ${refs || '—'}\n\n${value}\n`
      );
    })
  );
  const failed = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );
  for (const result of failed) {
    const reason: unknown = result.reason;
    console.error(
      `${item.id}: ${reason instanceof Error ? reason.message : String(reason)}`
    );
  }
  console.log(`${item.id}: ${runs - failed.length}/${runs} → ${dir}`);
}

await prisma.$disconnect();
