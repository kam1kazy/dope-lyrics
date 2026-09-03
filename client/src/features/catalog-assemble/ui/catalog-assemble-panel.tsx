'use client';

import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { Heart, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ASSEMBLE_TRACK,
  assembleTrackFilterFromSection,
  type IAssembledTrack,
  type IAssembledTrackSlot,
  type ILyricCollage,
  LIKE_COLLAGE,
  LYRIC_COLLAGES,
  type TrackFormPreset,
  UNLIKE_COLLAGE,
} from '@/entities/lyric';
import type { CatalogSectionFilters } from '@/shared/lib/catalog-section-filters';
import { ErrorText } from '@/shared/ui/error-text';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { formatCollageDate } from '../lib/generator-text';
import { AssembleSlotCard } from './assemble-slot-card';

function draftKey(slots: IAssembledTrackSlot[]): string {
  return slots
    .map((slot) =>
      [
        slot.songRole,
        ...slot.parts.map(
          (part) => `${part.lyricId}:${part.startLine}-${part.endLine}`
        ),
      ].join(',')
    )
    .join('|');
}

export function CatalogAssemblePanel({
  preset,
  hideAdlibs,
  filters,
  selectedCollage,
  onCloseSelected,
}: {
  preset: TrackFormPreset;
  hideAdlibs: boolean;
  filters: CatalogSectionFilters;
  selectedCollage: ILyricCollage | null;
  onCloseSelected: () => void;
}) {
  const [draft, setDraft] = useState<IAssembledTrackSlot[] | null>(null);
  const [likedDraftKey, setLikedDraftKey] = useState<string | null>(null);
  const [likedCollageId, setLikedCollageId] = useState<number | null>(null);

  const [assemble, { loading: assembleLoading, error: assembleError }] =
    useLazyQuery<{ assembleTrack: IAssembledTrack }>(ASSEMBLE_TRACK, {
      fetchPolicy: 'network-only',
    });

  const [likeCollage, { loading: likeLoading, error: likeError }] = useMutation<
    { likeCollage: ILyricCollage },
    {
      slots: {
        songRole: string;
        parts: { lyricId: number; startLine: number; endLine: number }[];
      }[];
    }
  >(LIKE_COLLAGE, {
    update(cache, { data }) {
      const created = data?.likeCollage;
      if (!created) {
        return;
      }

      const existing = cache.readQuery<{ lyricCollages: ILyricCollage[] }>({
        query: LYRIC_COLLAGES,
      });
      const previous = existing?.lyricCollages ?? [];
      if (previous.some((row) => row.id === created.id)) {
        return;
      }

      cache.writeQuery({
        query: LYRIC_COLLAGES,
        data: { lyricCollages: [created, ...previous] },
      });
    },
  });

  const [unlikeCollage, { loading: unlikeLoading, error: unlikeError }] =
    useMutation<{ unlikeCollage: number }, { id: number }>(UNLIKE_COLLAGE, {
      update(cache, { data }) {
        const removedId = data?.unlikeCollage;
        if (removedId == null) {
          return;
        }

        const existing = cache.readQuery<{ lyricCollages: ILyricCollage[] }>({
          query: LYRIC_COLLAGES,
        });
        const previous = existing?.lyricCollages ?? [];

        cache.writeQuery({
          query: LYRIC_COLLAGES,
          data: {
            lyricCollages: previous.filter((row) => row.id !== removedId),
          },
        });
      },
    });

  const { data: historyData } = useQuery<{ lyricCollages: ILyricCollage[] }>(
    LYRIC_COLLAGES,
    {
      skip: selectedCollage === null,
      fetchPolicy: 'cache-first',
    }
  );
  const viewedCollage =
    selectedCollage === null
      ? null
      : (historyData?.lyricCollages.find(
          (row) => row.id === selectedCollage.id
        ) ?? selectedCollage);

  const draftKeyValue = useMemo(
    () => (draft ? draftKey(draft) : null),
    [draft]
  );
  const alreadyLiked =
    draftKeyValue !== null && draftKeyValue === likedDraftKey;
  const viewingHistory = viewedCollage !== null;
  const slots = viewedCollage?.slots ?? draft;

  const handleAssemble = async () => {
    const result = await assemble({
      variables: {
        preset,
        hideAdlibs,
        filter: assembleTrackFilterFromSection(filters),
      },
    });
    const nextSlots = result.data?.assembleTrack.slots;
    if (!nextSlots) {
      return;
    }

    setDraft(nextSlots);
    setLikedDraftKey(null);
    setLikedCollageId(null);
    onCloseSelected();
  };

  const handleUnlike = async (id: number) => {
    const result = await unlikeCollage({ variables: { id } });
    if (result.data?.unlikeCollage == null) {
      return;
    }

    if (selectedCollage?.id === id) {
      setDraft(viewedCollage?.slots ?? selectedCollage.slots);
      setLikedDraftKey(null);
      setLikedCollageId(null);
      onCloseSelected();
      return;
    }

    if (likedCollageId === id) {
      setLikedDraftKey(null);
      setLikedCollageId(null);
    }
  };

  const handleLike = async () => {
    if (!draft) {
      return;
    }

    if (alreadyLiked && likedCollageId !== null) {
      await handleUnlike(likedCollageId);
      return;
    }

    const result = await likeCollage({
      variables: {
        slots: draft.map((slot) => ({
          songRole: slot.songRole,
          parts: slot.parts.map((part) => ({
            lyricId: part.lyricId,
            startLine: part.startLine,
            endLine: part.endLine,
          })),
        })),
      },
    });

    const created = result.data?.likeCollage;
    if (!created) {
      return;
    }

    setLikedDraftKey(draftKey(draft));
    setLikedCollageId(created.id);
  };

  const heartBusy = likeLoading || unlikeLoading;
  const heartFilled = viewingHistory || alreadyLiked;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {viewedCollage ? (
            <>
              <h3 className="min-w-0 flex-1 truncate text-sm font-medium">
                {formatCollageDate(viewedCollage.createdAt)}
              </h3>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="size-8"
                disabled={heartBusy}
                aria-label="Убрать из истории"
                onClick={() => {
                  void handleUnlike(viewedCollage.id);
                }}
              >
                {unlikeLoading ? (
                  <Spinner className="size-4" />
                ) : (
                  <Heart className="size-4" fill="currentColor" />
                )}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label="Закрыть"
                onClick={onCloseSelected}
              >
                <X className="size-4" />
              </Button>
            </>
          ) : (
            <div className="flex justify-between w-full">
              <Button
                type="button"
                size="sm"
                disabled={assembleLoading}
                onClick={() => {
                  void handleAssemble();
                }}
              >
                {assembleLoading ? <Spinner className="size-4" /> : 'Собрать'}
              </Button>
              <Button
                type="button"
                size="icon"
                variant={heartFilled ? 'secondary' : 'outline'}
                className="size-8"
                disabled={!draft || heartBusy}
                aria-label={
                  alreadyLiked
                    ? 'Убрать из истории'
                    : 'Лайк — сохранить в историю'
                }
                onClick={() => {
                  void handleLike();
                }}
              >
                {heartBusy ? (
                  <Spinner className="size-4" />
                ) : (
                  <Heart
                    className="size-4"
                    fill={heartFilled ? 'currentColor' : 'none'}
                  />
                )}
              </Button>
            </div>
          )}
        </div>

        {assembleError || likeError || unlikeError ? (
          <ErrorText title="Не удалось собрать или сохранить" />
        ) : null}

        {!slots ? (
          <p className="text-muted-foreground text-sm"></p>
        ) : (
          <div className="flex flex-col gap-4">
            {slots.map((slot, index) => (
              <AssembleSlotCard
                key={`${slot.songRole}-${index}-${draftKey([slot])}`}
                slot={slot}
                index={index}
                hideAdlibs={hideAdlibs}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
