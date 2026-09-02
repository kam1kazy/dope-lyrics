import type { Prisma } from '~/generated/prisma/client';
import { LYRIC_SONG_ROLES } from '~/modules/lyrics/lyric-facets';
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
  censoredOnly?: boolean | null;
  demoName?: string | null;
  demosOnly?: boolean | null;
  oldestFirst?: boolean | null;
  mood?: string[] | null;
  delivery?: string[] | null;
  songRole?: string[] | null;
  readiness?: string | null;
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

const jsonFacetContains = (
  role: string,
  field: 'mood' | 'delivery',
  value: string
): Prisma.LyricsWhereInput => ({
  roleProfiles: {
    path: [role, field],
    array_contains: value,
  },
});

const roleFacetWhere = (
  role: string,
  moods: string[],
  deliveries: string[]
): Prisma.LyricsWhereInput => {
  const parts: Prisma.LyricsWhereInput[] = [];

  if (moods.length > 0) {
    parts.push({
      OR: moods.map((mood) => jsonFacetContains(role, 'mood', mood)),
    });
  }

  if (deliveries.length > 0) {
    parts.push({
      OR: deliveries.map((delivery) =>
        jsonFacetContains(role, 'delivery', delivery)
      ),
    });
  }

  if (parts.length === 0) {
    return { songRole: { has: role } };
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return { AND: parts };
};

const buildFacetWhere = (
  moods: string[],
  deliveries: string[],
  roles: string[]
): Prisma.LyricsWhereInput | undefined => {
  if (moods.length === 0 && deliveries.length === 0 && roles.length === 0) {
    return undefined;
  }

  const targetRoles = roles.length > 0 ? roles : [...LYRIC_SONG_ROLES];

  if (roles.length > 0) {
    return {
      OR: roles.map((role) => roleFacetWhere(role, moods, deliveries)),
    };
  }

  const unscoped: Prisma.LyricsWhereInput[] = [];

  if (moods.length > 0) {
    unscoped.push({ mood: { hasSome: moods } });
  }

  if (deliveries.length > 0) {
    unscoped.push({ delivery: { hasSome: deliveries } });
  }

  const unscopedWhere: Prisma.LyricsWhereInput =
    unscoped.length === 1 ? unscoped[0] : { AND: unscoped };

  return {
    OR: [
      unscopedWhere,
      ...targetRoles.map((role) => roleFacetWhere(role, moods, deliveries)),
    ],
  };
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
    | 'censoredOnly'
    | 'demoName'
    | 'demosOnly'
    | 'mood'
    | 'delivery'
    | 'songRole'
    | 'readiness'
  >
): Prisma.LyricsWhereInput => {
  const tags = normalizeTags(options.tags);
  const emojis = normalizeEmojis(options.emojis);
  const keyword = normalizeKeyword(options.keyword);
  const referencesOnly = options.referencesOnly === true;
  const favoritesOnly = options.favoritesOnly === true;
  const hiddenOnly = options.hiddenOnly === true;
  const censoredOnly = options.censoredOnly === true;
  const demoName = options.demoName?.trim() ?? '';
  const demosOnly = options.demosOnly === true;

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
  } else if (demosOnly) {
    messageConditions.push({
      hashtags: {
        is: {
          tags: { has: DEMO_TAG },
        },
      },
    });
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

    if (censoredOnly) {
      where.isCensored = true;
    }
  }

  const dateWhere = buildDateWhere(options.dateFrom, options.dateTo);

  if (dateWhere) {
    where.date = dateWhere;
  }

  const moods = normalizeTags(options.mood);
  const deliveries = normalizeTags(options.delivery);
  const songRoles = normalizeTags(options.songRole);
  const readiness = options.readiness?.trim();

  const facetWhere = buildFacetWhere(moods, deliveries, songRoles);

  if (facetWhere) {
    where.AND = [facetWhere];
  }

  if (readiness) {
    where.readiness = readiness;
  }

  return where;
};
