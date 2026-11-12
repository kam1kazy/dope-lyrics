import { GraphQLError } from 'graphql';

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

/** Полка пользователя для подбора: приёмы по порядку, тексты новые сверху. */
export const loadArtistPool = async (
  userId: number,
  filter: ReferenceFilter | null | undefined
): Promise<ArtistProfile[]> => {
  if (
    (filter?.artistIds?.length ?? 0) > REFERENCE_FILTER_LIMIT ||
    (filter?.textIds?.length ?? 0) > REFERENCE_FILTER_LIMIT
  ) {
    throw new GraphQLError(
      `Эталонов — не больше ${REFERENCE_FILTER_LIMIT} артистов и ${REFERENCE_FILTER_LIMIT} текстов`
    );
  }

  const rows = await prisma.artist.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include: {
      techniques: { orderBy: { position: 'asc' } },
      texts: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] },
    },
  });

  return applyReferenceFilter(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      moods: row.moods,
      energies: row.energies,
      deliveries: row.deliveries,
      techniques: row.techniques.map((item) => ({
        kind: item.kind,
        label: item.label,
        instruction: item.instruction,
      })),
      texts: row.texts.map((item) => ({
        id: item.id,
        title: item.title,
        text: item.text,
        note: item.note,
        mood: item.mood,
        delivery: item.delivery,
        songRole: item.songRole,
        energy: item.energy,
      })),
    })),
    filter
  );
};
