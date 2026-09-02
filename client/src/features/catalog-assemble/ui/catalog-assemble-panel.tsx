'use client';

import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { Heart } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ASSEMBLE_TRACK,
  type IAssembledTrack,
  type IAssembledTrackSlot,
  type ILyricCollage,
  LIKE_COLLAGE,
  LYRIC_COLLAGES,
  LYRIC_SONG_ROLE_LABELS,
} from '@/entities/lyric';
import { ErrorText } from '@/shared/ui/error-text';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

function slotText(slot: IAssembledTrackSlot): string {
  if (slot.lyricId === null) {
    return 'нет кусков';
  }

  const text = slot.lyric?.message?.text?.trim();
  if (!text) {
    return 'фраза удалена';
  }

  return text;
}

function formatCollageDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function draftKey(slots: IAssembledTrackSlot[]): string {
  return slots
    .map((slot) => `${slot.songRole}:${slot.lyricId ?? ''}`)
    .join('|');
}

function SlotCard({
  slot,
  index,
}: {
  slot: IAssembledTrackSlot;
  index: number;
}) {
  const roleLabel = LYRIC_SONG_ROLE_LABELS[slot.songRole] ?? slot.songRole;
  const empty = slot.lyricId === null;

  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-muted-foreground text-xs">
        {index + 1}. {roleLabel}
      </p>
      <p
        className={
          empty
            ? 'text-muted-foreground mt-1 text-sm italic'
            : 'mt-1 text-sm whitespace-pre-wrap'
        }
      >
        {slotText(slot)}
      </p>
    </div>
  );
}

export function CatalogAssemblePanel() {
  const [draft, setDraft] = useState<IAssembledTrackSlot[] | null>(null);
  const [likedDraftKey, setLikedDraftKey] = useState<string | null>(null);

  const {
    loading: historyLoading,
    error: historyError,
    data: historyData,
    refetch: refetchHistory,
  } = useQuery<{ lyricCollages: ILyricCollage[] }>(LYRIC_COLLAGES);

  const [assemble, { loading: assembleLoading, error: assembleError }] =
    useLazyQuery<{ assembleTrack: IAssembledTrack }>(ASSEMBLE_TRACK, {
      fetchPolicy: 'network-only',
    });

  const [likeCollage, { loading: likeLoading, error: likeError }] = useMutation<
    { likeCollage: ILyricCollage },
    {
      slots: { songRole: string; lyricId: number | null }[];
    }
  >(LIKE_COLLAGE);

  const draftKeyValue = useMemo(
    () => (draft ? draftKey(draft) : null),
    [draft]
  );
  const alreadyLiked =
    draftKeyValue !== null && draftKeyValue === likedDraftKey;

  const history = historyData?.lyricCollages ?? [];

  const handleAssemble = async () => {
    const result = await assemble();
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
          lyricId: slot.lyricId,
        })),
      },
    });

    if (!result.data?.likeCollage) {
      return;
    }

    setLikedDraftKey(draftKey(draft));
    await refetchHistory();
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
            Нажмите «Собрать», чтобы случайно склеить куски по ролям.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {draft.map((slot, index) => (
              <SlotCard
                key={`${slot.songRole}-${index}-${slot.lyricId ?? 'empty'}`}
                slot={slot}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">История</h3>

        {historyLoading ? (
          <div className="flex justify-center py-6">
            <Spinner className="size-6" />
          </div>
        ) : null}

        {historyError ? (
          <ErrorText title="Не удалось загрузить историю" />
        ) : null}

        {!historyLoading && !historyError && history.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Пока нет сохранённых склеек. Соберите трек и поставьте лайк.
          </p>
        ) : null}

        {history.map((collage) => (
          <article
            key={collage.id}
            className="bg-muted/30 flex flex-col gap-2 rounded-lg border p-3"
          >
            <p className="text-muted-foreground text-xs">
              {formatCollageDate(collage.createdAt)}
            </p>
            <div className="flex flex-col gap-2">
              {collage.slots.map((slot, index) => (
                <SlotCard
                  key={`${collage.id}-${index}`}
                  slot={slot}
                  index={index}
                />
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
