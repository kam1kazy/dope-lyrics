import type { Prisma } from '~/generated/prisma/client';
import { DEMO_TAG, UNNAMED_DEMO_NAME } from '~/modules/lyrics/shelf-tags';

export interface LyricsListOptions {
  limit: number;
  offset: number;
  tags?: string[] | null;
  keyword?: string | null;
  emojis?: string[] | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  referencesOnly?: boolean | null;
  favoritesOnly?: boolean | null;
  hiddenOnly?: boolean | null;
  demoName?: string | null;
}

export const normalizeTags = (tags: string[] | null | undefined): string[] => {
  if (!tags?.length) {
    return [];
  }

  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
};

export const normalizeEmojis = (
  emojis: string[] | null | undefined
): string[] => {
  if (!emojis?.length) {
    return [];
  }

  return [...new Set(emojis.map((emoji) => emoji.trim()).filter(Boolean))];
};

export const normalizeKeyword = (
  keyword: string | null | undefined
): string => {
  return keyword?.trim() ?? '';
};

const parseDateStart = (value: string): Date | null => {
  const parsed = new Date(`${value}T00:00:00.000`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseDateEnd = (value: string): Date | null => {
  const parsed = new Date(`${value}T23:59:59.999`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildDateWhere = (
  dateFrom: string | null | undefined,
  dateTo: string | null | undefined
): Prisma.DateTimeFilter | undefined => {
  const from = dateFrom?.trim();
  const to = dateTo?.trim();
  const dateFilter: Prisma.DateTimeFilter = {};

  if (from) {
    const start = parseDateStart(from);

    if (start) {
      dateFilter.gte = start;
    }
  }

  if (to) {
    const end = parseDateEnd(to);

    if (end) {
      dateFilter.lte = end;
    }
  }

  return Object.keys(dateFilter).length > 0 ? dateFilter : undefined;
};

export const buildLyricsWhere = (
  options: Pick<
    LyricsListOptions,
    | 'tags'
    | 'keyword'
    | 'emojis'
    | 'dateFrom'
    | 'dateTo'
    | 'referencesOnly'
    | 'favoritesOnly'
    | 'hiddenOnly'
    | 'demoName'
  >
): Prisma.LyricsWhereInput => {
  const tags = normalizeTags(options.tags);
  const emojis = normalizeEmojis(options.emojis);
  const keyword = normalizeKeyword(options.keyword);
  const referencesOnly = options.referencesOnly === true;
  const favoritesOnly = options.favoritesOnly === true;
  const hiddenOnly = options.hiddenOnly === true;
  const demoName = options.demoName?.trim() ?? '';

  const messageConditions: Prisma.MessageWhereInput[] = [
    { text: { not: null } },
    { NOT: { text: '' } },
  ];

  if (keyword) {
    messageConditions.push({
      text: { contains: keyword, mode: 'insensitive' },
    });
  }

  if (tags.length > 0) {
    messageConditions.push({
      hashtags: {
        is: {
          tags: { hasSome: tags },
        },
      },
    });
  }

  if (emojis.length > 0) {
    messageConditions.push({
      reactions: {
        is: {
          emojis: {
            some: {
              emoji: { in: emojis },
            },
          },
        },
      },
    });
  }

  if (demoName) {
    if (demoName === UNNAMED_DEMO_NAME) {
      messageConditions.push({
        hashtags: {
          is: {
            tags: { equals: [DEMO_TAG] },
          },
        },
      });
    } else {
      messageConditions.push({
        hashtags: {
          is: {
            AND: [{ tags: { has: DEMO_TAG } }, { tags: { has: demoName } }],
          },
        },
      });
    }
  }

  const where: Prisma.LyricsWhereInput = {
    message: {
      AND: messageConditions,
    },
  };

  if (hiddenOnly) {
    where.isHidden = true;
  } else {
    where.isHidden = false;

    if (favoritesOnly) {
      where.isFavorite = true;
    }

    if (referencesOnly) {
      where.isReference = true;
    }
  }

  const dateWhere = buildDateWhere(options.dateFrom, options.dateTo);

  if (dateWhere) {
    where.date = dateWhere;
  }

  return where;
};
