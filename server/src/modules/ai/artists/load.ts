import { GraphQLError } from 'graphql';

import type { Prisma } from '~/generated/prisma/client';
import { prisma } from '~/infrastructure/prisma';
import type { ArtistProfile } from '~/modules/ai/artists/profiles';

export type ReferenceFilter = {
  artistIds?: readonly number[] | null;
  textIds?: readonly number[] | null;
};

/** Не больше трёх артистов и трёх текстов в фильтре. */
export const REFERENCE_FILTER_LIMIT = 3;

const hasIds = (ids: readonly number[] | null | undefined): boolean =>
  (ids?.length ?? 0) > 0;

export const isReferenceFilterActive = (
  filter: ReferenceFilter | null | undefined
): boolean => hasIds(filter?.artistIds) || hasIds(filter?.textIds);

/**
 * Жёсткий фильтр: без выбора — вся полка; иначе выбранные артисты и артисты выбранных текстов.
 * У артиста с выбранными текстами остаются только они.
 */
export const applyReferenceFilter = (
  artists: readonly ArtistProfile[],
  filter: ReferenceFilter | null | undefined
): ArtistProfile[] => {
  if (!isReferenceFilterActive(filter)) {
    return [...artists];
  }

  const artistIds = new Set(filter?.artistIds ?? []);
  const textIds = new Set(filter?.textIds ?? []);

  return artists.flatMap((artist) => {
    const chosen = artist.texts.filter((sample) => textIds.has(sample.id));

    if (chosen.length > 0) {
      return [{ ...artist, texts: chosen }];
    }

    return artistIds.has(artist.id) ? [artist] : [];
  });
};

const POOL_SELECT = {
  id: true,
  name: true,
  moods: true,
  energies: true,
  deliveries: true,
  techniques: {
    orderBy: { position: 'asc' },
    select: { kind: true, label: true, instruction: true },
  },
  texts: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      title: true,
      text: true,
      note: true,
      mood: true,
      delivery: true,
      songRole: true,
      energy: true,
    },
  },
} satisfies Prisma.ArtistSelect;

/** Полка пользователя для подбора: приёмы по порядку, тексты новые сверху. При фильтре из базы идут только нужные артисты. */
export const loadArtistPool = async (
  userId: number,
  filter: ReferenceFilter | null | undefined
): Promise<ArtistProfile[]> => {
  const artistIds = [...(filter?.artistIds ?? [])];
  const textIds = [...(filter?.textIds ?? [])];

  if (
    artistIds.length > REFERENCE_FILTER_LIMIT ||
    textIds.length > REFERENCE_FILTER_LIMIT
  ) {
    throw new GraphQLError(
      `Эталонов — не больше ${REFERENCE_FILTER_LIMIT} артистов и ${REFERENCE_FILTER_LIMIT} текстов`
    );
  }

  const rows = await prisma.artist.findMany({
    where: {
      userId,
      ...(isReferenceFilterActive(filter)
        ? {
            OR: [
              { id: { in: artistIds } },
              { texts: { some: { id: { in: textIds } } } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    select: POOL_SELECT,
  });

  return applyReferenceFilter(rows, filter);
};
