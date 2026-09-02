import { prisma } from '~/infrastructure/prisma';
import { DEMO_TAG, UNNAMED_DEMO_NAME } from '~/modules/lyrics/shelf-tags';

export interface LyricDemoGroup {
  name: string;
  count: number;
}

const demoLyricsWhere = {
  isHidden: false,
  message: {
    hashtags: {
      is: {
        tags: { has: DEMO_TAG },
      },
    },
  },
} as const;

export async function listLyricDemos(): Promise<LyricDemoGroup[]> {
  const rows = await prisma.lyrics.findMany({
    where: demoLyricsWhere,
    select: {
      message: {
        select: {
          hashtags: {
            select: { tags: true },
          },
        },
      },
    },
  });

  const counts = new Map<string, number>();
  let unnamedCount = 0;

  for (const row of rows) {
    const tags = row.message?.hashtags?.tags ?? [];
    const demoNames = tags.filter((tag) => tag !== DEMO_TAG);

    if (demoNames.length === 0) {
      unnamedCount += 1;
      continue;
    }

    for (const name of demoNames) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  const result = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  if (unnamedCount > 0) {
    result.push({ name: UNNAMED_DEMO_NAME, count: unnamedCount });
  }

  return result;
}
