import { parseArgs } from 'util';

import { prisma } from '~/infrastructure/prisma';
import { isAiConfigured } from '~/modules/ai/model/polza.client';
import {
  fetchPopularTrackTitles,
  importOneReferenceTrack,
  tagsFromArtistCard,
} from '~/modules/ai/references/track-import';
import { LyricsSourceError } from '~/modules/references/lyrics-sources';
import {
  createArtist,
  listArtists,
} from '~/modules/references/references.service';

const USAGE = [
  'Топ: Deezer (fallback Genius). Тексты: LRCLIB → DarkTexts/TXTsong/Musixmatch/Lyricsify/AZLyrics → Genius → веб-поиск.',
  'Genius: опционально GENIUS_ACCESS_TOKEN в server/.env.',
  'Теги — отдельный вызов ИИ (или --tags card).',
  '',
  'bun run reference:tracks [--per-artist 10] [--artist "Drake"] [--delay 400]',
  '',
  '  --per-artist   сколько треков на артиста (по умолчанию 10)',
  '  --artist       только эти артисты (подстрока), можно несколько',
  '  --add          создать артиста, если нет',
  '  --delay        пауза между треками, мс (по умолчанию 1200)',
  '  --tags         ai (по умолчанию) или card — без ИИ',
  '  --dry          только план',
].join('\n');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const { values } = parseArgs({
  options: {
    'per-artist': { type: 'string', default: '10' },
    artist: { type: 'string', multiple: true },
    add: { type: 'string', multiple: true },
    delay: { type: 'string', default: '1200' },
    tags: { type: 'string', default: 'ai' },
    dry: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help) {
  console.log(USAGE);
  process.exit(0);
}

const perArtist = Number(values['per-artist']);
const delayMs = Number(values.delay);
const filters = (values.artist ?? []).map((name) => name.toLowerCase());
const toAdd = values.add ?? [];
const tagMode = values.tags === 'card' ? 'card' : 'ai';

if (!Number.isFinite(perArtist) || perArtist < 1 || perArtist > 20) {
  console.error('--per-artist: от 1 до 20');
  process.exit(1);
}

if (tagMode === 'ai' && !isAiConfigured()) {
  console.error('ИИ не настроен — задайте ключи или --tags card');
  process.exit(1);
}

const main = async () => {
  const owner = await prisma.users.findFirst({
    where: { role: 'OWNER' },
    select: { id: true },
  });

  if (!owner) {
    console.error('В базе нет владельца (OWNER)');
    process.exit(1);
  }

  const userId = owner.id;

  for (const rawName of toAdd) {
    const name = rawName.replace(/\s+/g, ' ').trim();
    if (!name) {
      continue;
    }

    const exists = await prisma.artist.findFirst({
      where: { userId, name: { equals: name, mode: 'insensitive' } },
    });

    if (!exists) {
      if (values.dry) {
        console.log(`[dry] создать артиста: ${name}`);
      } else {
        await createArtist(userId, name);
        console.log(`Создан артист: ${name}`);
      }
    }
  }

  let artists = await listArtists(userId);

  if (filters.length > 0) {
    artists = artists.filter((artist) =>
      filters.some((needle) => artist.name.toLowerCase().includes(needle))
    );
  }

  if (artists.length === 0) {
    console.error('Нет артистов под фильтр');
    process.exit(1);
  }

  console.log(
    `Артистов: ${artists.length}, по ${perArtist} треков, теги: ${tagMode}, пауза ${delayMs} мс`
  );

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const artist of artists) {
    const have = artist.texts.length;
    const need = Math.max(0, perArtist - have);

    if (need === 0) {
      console.log(`\n— ${artist.name}: уже ${have} текстов, пропуск`);
      skipped += perArtist;
      continue;
    }

    const existingTitles = new Set(
      artist.texts.map((row) => row.title?.toLowerCase() ?? '')
    );

    console.log(`\n— ${artist.name}: есть ${have}, добрать ${need}`);

    if (values.dry) {
      console.log(`  [dry] топ ${need} (ListenBrainz) + LRCLIB`);
      continue;
    }

    let titles: string[];

    try {
      titles = await fetchPopularTrackTitles(artist.name, 50);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  список треков: ${message}`);
      failed += need;
      continue;
    }

    titles = titles.filter((title) => !existingTitles.has(title.toLowerCase()));
    titles = titles.slice(0, need);

    if (titles.length < need) {
      console.warn(`  названий: ${titles.length} (ожидали ${need})`);
    }

    const fallbackTags = tagsFromArtistCard(artist);

    for (const title of titles) {
      try {
        const track = await importOneReferenceTrack(userId, artist, title, {
          tagWithAi: tagMode === 'ai',
          fallbackTags,
        });
        added += 1;
        console.log(
          `  + «${track.title}» (${track.tags.mood.join(', ') || '—'})`
        );
        existingTitles.add(track.title.toLowerCase());
        await sleep(delayMs);
      } catch (error: unknown) {
        const message =
          error instanceof LyricsSourceError || error instanceof Error
            ? error.message
            : String(error);
        console.error(`  «${title}»: ${message}`);
        failed += 1;
        await sleep(delayMs);
      }
    }
  }

  console.log(
    `\nГотово: добавлено ${added}, пропущено (полные полки) ${skipped}, ошибок ${failed}`
  );
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
