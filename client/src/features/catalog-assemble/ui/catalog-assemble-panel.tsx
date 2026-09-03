'use client';

import { useLazyQuery, useMutation } from '@apollo/client/react';
import { Heart } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ASSEMBLE_TRACK,
  type IAssembledTrack,
  type IAssembledTrackSlot,
  type ILyricCollage,
  LIKE_COLLAGE,
  type TrackFormPreset,
} from '@/entities/lyric';
import { ErrorText } from '@/shared/ui/error-text';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

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
}: {
  preset: TrackFormPreset;
  hideAdlibs: boolean;
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

  const handleAssemble = async () => {
    const result = await assemble({
      variables: { preset, hideAdlibs },
    });
    const slots = result.data?.assembleTrack.slots;
    if (!slots) {
      return;
    }

    setDraft(slots);
    setLikedDraftKey(null);
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
        </div>

        {assembleError || likeError ? (
          <ErrorText title="Не удалось собрать или сохранить" />
        ) : null}

        {!draft ? (
          <p className="text-muted-foreground text-sm">
            Нажмите «Собрать», чтобы склеить куски по выбранной форме.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {draft.map((slot, index) => (
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
