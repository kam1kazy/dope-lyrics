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
  includeCensored?: boolean | null;
  includeShelves?: string[] | null;
  excludeShelves?: string[] | null;
  demoName?: string | null;
  demosOnly?: boolean | null;
  oldestFirst?: boolean | null;
  shuffleSeed?: number | null;
  mood?: string[] | null;
  excludeMood?: string[] | null;
  delivery?: string[] | null;
  excludeDelivery?: string[] | null;
  songRole?: string[] | null;
  excludeSongRole?: string[] | null;
  readiness?: string[] | null;
  excludeReadiness?: string[] | null;
  energy?: string[] | null;
  excludeEnergy?: string[] | null;
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

const lyricHasJsonFacet = (
  field: 'mood' | 'delivery',
  values: string[]
): Prisma.LyricsWhereInput => {
  const onLyric: Prisma.LyricsWhereInput =
    field === 'mood'
      ? { mood: { hasSome: values } }
      : { delivery: { hasSome: values } };

  return {
    OR: [
      onLyric,
      ...LYRIC_SONG_ROLES.flatMap((role) =>
        values.map((value) => jsonFacetContains(role, field, value))
      ),
    ],
  };
};

const buildExcludeFacetWhere = (
  moods: string[],
  deliveries: string[],
  roles: string[]
): Prisma.LyricsWhereInput | undefined => {
  const parts: Prisma.LyricsWhereInput[] = [];

  if (moods.length > 0) {
    parts.push({ NOT: lyricHasJsonFacet('mood', moods) });
  }

  if (deliveries.length > 0) {
    parts.push({ NOT: lyricHasJsonFacet('delivery', deliveries) });
  }

  if (roles.length > 0) {
    parts.push({ NOT: { songRole: { hasSome: roles } } });
  }

  if (parts.length === 0) {
    return undefined;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return { AND: parts };
};

const SHELF_FLAGS = [
  'favorites',
  'references',
  'censored',
  'hidden',
  'donors',
] as const;

type ShelfFlag = (typeof SHELF_FLAGS)[number];

const isShelfFlag = (value: string): value is ShelfFlag => {
  return (SHELF_FLAGS as readonly string[]).includes(value);
};

const normalizeShelfFlags = (
  values: string[] | null | undefined
): ShelfFlag[] | null => {
  if (values == null) {
    return null;
  }

  return [...new Set(values.filter(isShelfFlag))];
};

const buildShelfClause = (
  includeShelves: string[] | null | undefined,
  excludeShelves: string[] | null | undefined
): Prisma.LyricsWhereInput | null => {
  const included = normalizeShelfFlags(includeShelves);
  const excluded = normalizeShelfFlags(excludeShelves);

  if (included == null && excluded == null) {
    return null;
  }

  const include = included ?? [];
  const exclude = excluded ?? [];
  const hideHidden = exclude.includes('hidden') && !include.includes('hidden');
  const clauses: Prisma.LyricsWhereInput[] = [];

  if (include.length > 0) {
    const or: Prisma.LyricsWhereInput[] = [];

    if (include.includes('favorites')) {
      or.push(
        hideHidden
          ? { isFavorite: true, isHidden: false }
          : { isFavorite: true }
      );
    }

    if (include.includes('references')) {
      or.push(
        hideHidden
          ? { isReference: true, isHidden: false }
          : { isReference: true }
      );
    }

    if (include.includes('censored')) {
      or.push(
        hideHidden
          ? { isCensored: true, isHidden: false }
          : { isCensored: true }
      );
    }

    if (include.includes('hidden')) {
      or.push({ isHidden: true });
    }

    if (include.includes('donors')) {
      or.push({ isDonor: true });
    }

    if (or.length > 0) {
      clauses.push({ OR: or });
    }
  } else if (exclude.includes('hidden')) {
    clauses.push({ isHidden: false });
  }

  if (exclude.includes('censored') && !include.includes('censored')) {
    clauses.push({ isCensored: false });
  }

  if (exclude.includes('favorites') && !include.includes('favorites')) {
    clauses.push({ isFavorite: false });
  }

  if (exclude.includes('references') && !include.includes('references')) {
    clauses.push({ isReference: false });
  }

  if (exclude.includes('donors') && !include.includes('donors')) {
    clauses.push({ isDonor: false });
  }

  if (exclude.includes('hidden')) {
    clauses.push({ isHidden: false });
  }

  if (clauses.length === 0) {
    return {};
  }

  if (clauses.length === 1) {
    return clauses[0];
  }

  return { AND: clauses };
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
    | 'includeCensored'
    | 'includeShelves'
    | 'excludeShelves'
    | 'demoName'
    | 'demosOnly'
    | 'mood'
    | 'excludeMood'
    | 'delivery'
    | 'excludeDelivery'
    | 'songRole'
    | 'excludeSongRole'
    | 'readiness'
    | 'excludeReadiness'
    | 'energy'
    | 'excludeEnergy'
  >
): Prisma.LyricsWhereInput => {
  const tags = normalizeTags(options.tags);
  const emojis = normalizeEmojis(options.emojis);
  const keyword = normalizeKeyword(options.keyword);
  const referencesOnly = options.referencesOnly === true;
  const favoritesOnly = options.favoritesOnly === true;
  const hiddenOnly = options.hiddenOnly === true;
  const censoredOnly = options.censoredOnly === true;
  const includeCensored = options.includeCensored === true;
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

  const shelfClause = buildShelfClause(
    options.includeShelves,
    options.excludeShelves
  );
  const andParts: Prisma.LyricsWhereInput[] = [];

  if (shelfClause) {
    andParts.push(shelfClause);
  } else if (hiddenOnly) {
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
    } else if (!includeCensored) {
      where.isCensored = false;
    }
  }

  const dateWhere = buildDateWhere(options.dateFrom, options.dateTo);

  if (dateWhere) {
    where.date = dateWhere;
  }

  const moods = normalizeTags(options.mood);
  const excludeMoods = normalizeTags(options.excludeMood);
  const deliveries = normalizeTags(options.delivery);
  const excludeDeliveries = normalizeTags(options.excludeDelivery);
  const songRoles = normalizeTags(options.songRole);
  const excludeSongRoles = normalizeTags(options.excludeSongRole);
  const readiness = normalizeTags(options.readiness);
  const excludeReadiness = normalizeTags(options.excludeReadiness);
  const energy = normalizeTags(options.energy);
  const excludeEnergy = normalizeTags(options.excludeEnergy);

  const facetWhere = buildFacetWhere(moods, deliveries, songRoles);

  if (facetWhere) {
    andParts.push(facetWhere);
  }

  const excludeFacetWhere = buildExcludeFacetWhere(
    excludeMoods,
    excludeDeliveries,
    excludeSongRoles
  );

  if (excludeFacetWhere) {
    andParts.push(excludeFacetWhere);
  }

  if (readiness.length > 0) {
    andParts.push({ readiness: { in: readiness } });
  }

  if (excludeReadiness.length > 0) {
    andParts.push({
      OR: [{ readiness: null }, { readiness: { notIn: excludeReadiness } }],
    });
  }

  if (energy.length > 0) {
    andParts.push({ energy: { in: energy } });
  }

  if (excludeEnergy.length > 0) {
    andParts.push({
      OR: [{ energy: null }, { energy: { notIn: excludeEnergy } }],
    });
  }

  if (andParts.length > 0) {
    where.AND = andParts;
  }

  return where;
};
