'use client';

import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { Combine, Heart, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  ASSEMBLE_TRACK,
  assembleTrackFilterFromSection,
  GLUE_LYRICS,
  type IAssembledTrack,
  type IAssembledTrackSlot,
  type ILyric,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/shadcn/ui/tooltip';

import { formatCollageDate } from '../lib/generator-text';
import { AssembleSlotCard } from './assemble-slot-card';

const GLUE_HINT =
  'Склеить сборку в одну запись каталога. Оригиналы можно оставить или спрятать.';

function GlueButton({
  disabled,
  loading,
  onClick,
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8"
            disabled={disabled}
            aria-label="Склеить"
            onClick={onClick}
          >
            {loading ? (
              <Spinner className="size-4" />
            ) : (
              <Combine className="size-4" />
            )}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{GLUE_HINT}</TooltipContent>
    </Tooltip>
  );
}

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

function slotsHaveParts(slots: IAssembledTrackSlot[]): boolean {
  return slots.some((slot) => slot.parts.length > 0);
}

function slotsToInput(slots: IAssembledTrackSlot[]) {
  return slots.map((slot) => ({
    songRole: slot.songRole,
    parts: slot.parts.map((part) => ({
      lyricId: part.lyricId,
      startLine: part.startLine,
      endLine: part.endLine,
    })),
  }));
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
  const [gluePromptOpen, setGluePromptOpen] = useState(false);

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

  const [glueLyrics, { loading: glueLoading, error: glueError }] = useMutation<
    { glueLyrics: ILyric },
    {
      slots: {
        songRole: string;
        parts: { lyricId: number; startLine: number; endLine: number }[];
      }[];
      hideOriginals: boolean;
    }
  >(GLUE_LYRICS, {
    update(cache) {
      cache.evict({ fieldName: 'lyrics' });
      cache.evict({ fieldName: 'catalogStats' });
      cache.evict({ fieldName: 'lyricCollages' });
      cache.gc();
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
  const canGlue = slots != null && slotsHaveParts(slots);

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
        slots: slotsToInput(draft),
      },
    });

    const created = result.data?.likeCollage;
    if (!created) {
      return;
    }

    setLikedDraftKey(draftKey(draft));
    setLikedCollageId(created.id);
  };

  const handleGlue = async (hideOriginals: boolean) => {
    if (!slots) {
      return;
    }

    const result = await glueLyrics({
      variables: {
        slots: slotsToInput(slots),
        hideOriginals,
      },
    });

    if (!result.data?.glueLyrics) {
      return;
    }

    setGluePromptOpen(false);
    setDraft(null);
    setLikedDraftKey(null);
    setLikedCollageId(null);
    onCloseSelected();
    toast.success(
      hideOriginals
        ? 'Склеено, оригиналы скрыты'
        : 'Склеено, оригиналы на месте'
    );
  };

  const heartBusy = likeLoading || unlikeLoading;
  const heartFilled = viewingHistory || alreadyLiked;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-10">
        {gluePromptOpen ? (
          <div className="flex flex-col gap-3">
            <p className="text-lg font-semibold">Оригиналы скрыть?</p>
            <p className="text-muted-foreground text-sm">
              Сборка станет одной записью каталога. 
              <br />
              При «Скрыть» доноров спрячем
              и вырежем взятые куски.
              <br />
              <br />
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={glueLoading}
                onClick={() => {
                  void handleGlue(true);
                }}
              >
                Скрыть
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={glueLoading}
                onClick={() => {
                  void handleGlue(false);
                }}
              >
                Оставить
              </Button>
              <Button
                type="button"
                variant="ghost"
                className='ml-auto'
                disabled={glueLoading}
                onClick={() => {
                  setGluePromptOpen(false);
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {viewedCollage ? (
              <>
                <h3 className="min-w-0 flex-1 truncate text-sm font-medium">
                  {formatCollageDate(viewedCollage.createdAt)}
                </h3>
                <GlueButton
                  disabled={!canGlue || glueLoading}
                  loading={glueLoading}
                  onClick={() => {
                    setGluePromptOpen(true);
                  }}
                />
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
              <div className="flex w-full justify-between">
                <Button
                  type="button"
                  size="sm"
                  variant='outline'
                  disabled={assembleLoading}
                  onClick={() => {
                    void handleAssemble();
                  }}
                >
                  {assembleLoading ? <Spinner className="size-4" /> : 'Собрать'}
                </Button>
                <div className="flex items-center gap-2">
                  <GlueButton
                    disabled={!canGlue || glueLoading}
                    loading={glueLoading}
                    onClick={() => {
                      setGluePromptOpen(true);
                    }}
                  />
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
              </div>
            )}
          </div>
        )}

        {assembleError || likeError || unlikeError || glueError ? (
          <ErrorText title="Не удалось собрать, сохранить или склеить" />
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
