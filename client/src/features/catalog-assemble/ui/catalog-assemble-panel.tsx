'use client';

import { useLazyQuery, useMutation } from '@apollo/client/react';
import { Heart, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ASSEMBLE_TRACK,
  assembleTrackFilterFromSection,
  type IAssembledTrack,
  type IAssembledTrackSlot,
  type ILyricCollage,
  LIKE_COLLAGE,
  type TrackFormPreset,
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
    refetchQueries: ['LyricCollages'],
  });

  const draftKeyValue = useMemo(
    () => (draft ? draftKey(draft) : null),
    [draft]
  );
  const alreadyLiked =
    draftKeyValue !== null && draftKeyValue === likedDraftKey;
  const viewingHistory = selectedCollage !== null;
  const slots = viewingHistory ? selectedCollage.slots : draft;

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
    onCloseSelected();
  };

  const handleLike = async () => {
    if (!draft) {
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

    if (!result.data?.likeCollage) {
      return;
    }

    setLikedDraftKey(draftKey(draft));
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {viewingHistory ? (
            <>
              <h3 className="min-w-0 flex-1 truncate text-sm font-medium">
                {formatCollageDate(selectedCollage.createdAt)}
              </h3>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="size-8"
                disabled
                aria-label="Сохранено в истории"
              >
                <Heart className="size-4" fill="currentColor" />
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
            <>
              <h3 className="text-sm font-medium">Сборка</h3>
              <Button
                type="button"
                size="sm"
                className="ml-auto"
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
                variant={alreadyLiked ? 'secondary' : 'outline'}
                className="size-8"
                disabled={!draft || likeLoading || alreadyLiked}
                aria-label="Лайк — сохранить в историю"
                onClick={() => {
                  void handleLike();
                }}
              >
                {likeLoading ? (
                  <Spinner className="size-4" />
                ) : (
                  <Heart
                    className="size-4"
                    fill={alreadyLiked ? 'currentColor' : 'none'}
                  />
                )}
              </Button>
            </>
          )}
        </div>

        {assembleError || likeError ? (
          <ErrorText title="Не удалось собрать или сохранить" />
        ) : null}

        {!slots ? (
          <p className="text-muted-foreground text-sm">
            Нажмите «Собрать», чтобы склеить куски по выбранной форме.
          </p>
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
