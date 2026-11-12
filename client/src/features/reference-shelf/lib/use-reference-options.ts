'use client';

import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import type { MultiSelectGroup } from '@/shared/ui/multi-select';

import { ARTISTS, type IArtistListItem } from '../api/queries';
import { referenceTextTitle } from './text-title';

/** Полка для фильтров и сводки: опции мультиселектов, имена и живые id. */
export const useReferenceOptions = (enabled: boolean) => {
  const { data } = useQuery<{ artists: IArtistListItem[] }>(ARTISTS, {
    skip: !enabled,
    fetchPolicy: 'cache-and-network',
  });

  return useMemo(() => {
    const artists = data?.artists ?? [];
    const artistGroups: MultiSelectGroup[] = [
      {
        options: artists.map((artist) => ({
          value: artist.id,
          label: artist.name,
        })),
      },
    ];
    const textGroups: MultiSelectGroup[] = artists
      .filter((artist) => artist.texts.length > 0)
      .map((artist) => ({
        label: artist.name,
        options: artist.texts.map((text) => ({
          value: text.id,
          label: referenceTextTitle(text),
        })),
      }));
    const texts = artists.flatMap((artist) => artist.texts);

    return {
      loaded: data !== undefined,
      artistGroups,
      textGroups,
      names: {
        artists: new Map(artists.map((artist) => [artist.id, artist.name])),
        texts: new Map(
          texts.map((text) => [text.id, referenceTextTitle(text)])
        ),
      },
      live: {
        artistIds: new Set(artists.map((artist) => artist.id)),
        textIds: new Set(texts.map((text) => text.id)),
      },
    };
  }, [data]);
};
