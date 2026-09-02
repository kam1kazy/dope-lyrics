import type { Prisma } from '~/generated/prisma/client';
import { REFERENCE_TAGS } from '~/modules/lyrics/reference-tags';

export interface LyricsListOptions {
  limit: number;
  offset: number;
  tags?: string[] | null;
  keyword?: string | null;
  emojis?: string[] | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  referencesOnly?: boolean | null;
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
    'tags' | 'keyword' | 'emojis' | 'dateFrom' | 'dateTo' | 'referencesOnly'
  >
): Prisma.LyricsWhereInput => {
  const tags = normalizeTags(options.tags);
  const emojis = normalizeEmojis(options.emojis);
  const keyword = normalizeKeyword(options.keyword);
  const referencesOnly = options.referencesOnly === true;

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

  if (referencesOnly) {
    messageConditions.push({
      hashtags: {
        is: {
          tags: { hasSome: [...REFERENCE_TAGS] },
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

  const where: Prisma.LyricsWhereInput = {
    message: {
      AND: messageConditions,
    },
  };

  const dateWhere = buildDateWhere(options.dateFrom, options.dateTo);

  if (dateWhere) {
    where.date = dateWhere;
  }

  return where;
};
