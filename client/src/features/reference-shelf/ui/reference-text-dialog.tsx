'use client';

import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { FacetChipGroup } from '@/entities/lyric';
import { formatQueryError } from '@/shared/lib/format-query-error';
import {
  LYRIC_DELIVERIES,
  LYRIC_DELIVERY_HINTS,
  LYRIC_DELIVERY_LABELS,
  LYRIC_ENERGIES,
  LYRIC_ENERGY_HINTS,
  LYRIC_ENERGY_LABELS,
  LYRIC_MOOD_HINTS,
  LYRIC_MOOD_LABELS,
  LYRIC_MOODS,
  LYRIC_SONG_ROLE_HINTS,
  LYRIC_SONG_ROLE_LABELS,
  LYRIC_SONG_ROLES,
} from '@/shared/lib/lyric-facets';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/ui/dialog';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  ARTIST,
  ARTISTS,
  CREATE_REFERENCE_TEXT,
  type IReferenceText,
  UPDATE_REFERENCE_TEXT,
} from '../api/queries';
import { pickKnown } from '../lib/card';

type Tags = Pick<IReferenceText, 'mood' | 'delivery' | 'songRole' | 'energy'>;

const sameTags = (left: Tags, right: Tags) =>
  JSON.stringify(left) === JSON.stringify(right);

/** Добавить или изменить текст артиста. Вернёт id, если текст надо разметить ИИ заново. */
export function ReferenceTextDialog({
  artistId,
  text,
  open,
  onOpenChange,
  onNeedsTags,
}: {
  artistId: number;
  text: IReferenceText | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNeedsTags: (id: number) => void;
}) {
  const [title, setTitle] = useState(text?.title ?? '');
  const [body, setBody] = useState(text?.text ?? '');
  const initialTags: Tags = {
    mood: text?.mood ?? [],
    delivery: text?.delivery ?? [],
    songRole: text?.songRole ?? [],
    energy: text?.energy ?? null,
  };
  const [tags, setTags] = useState<Tags>(initialTags);
  const [error, setError] = useState<string | null>(null);
  const refetch = { refetchQueries: [ARTISTS, ARTIST] };
  const [createText, { loading: creating }] = useMutation<{
    createReferenceText: IReferenceText;
  }>(CREATE_REFERENCE_TEXT, refetch);
  const [updateText, { loading: updating }] = useMutation<{
    updateReferenceText: IReferenceText;
  }>(UPDATE_REFERENCE_TEXT, refetch);
  const saving = creating || updating;

  const handleSave = async () => {
    setError(null);

    try {
      if (!text) {
        const { data } = await createText({
          variables: { artistId, title, text: body },
        });
        onOpenChange(false);
        if (data) {
          onNeedsTags(data.createReferenceText.id);
        }
        return;
      }

      const tagsChanged = !sameTags(tags, initialTags);
      const { data } = await updateText({
        variables: {
          id: text.id,
          input: { title, text: body, ...(tagsChanged ? tags : {}) },
        },
      });
      onOpenChange(false);
      toast.success('Текст сохранён');
      if (data && !data.updateReferenceText.tagged) {
        onNeedsTags(data.updateReferenceText.id);
      }
    } catch (caught: unknown) {
      setError(formatQueryError(caught));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{text ? 'Текст артиста' : 'Новый текст'}</DialogTitle>
          <DialogDescription>
            {text
              ? 'Если поменять сам текст, ИИ поставит теги заново.'
              : 'После сохранения ИИ поставит теги: настроение, подачу, роль, энергию.'}
          </DialogDescription>
        </DialogHeader>
        <Input
          data-swipe-ignore
          value={title}
          maxLength={120}
          placeholder="Название (необязательно)"
          aria-label="Название"
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
        <textarea
          data-swipe-ignore
          value={body}
          rows={12}
          placeholder="Вставьте куплет, хук или весь текст"
          aria-label="Текст"
          className="border-input bg-background focus-visible:ring-ring/50 w-full resize-y rounded-md border p-3 text-sm outline-none focus-visible:ring-2"
          onChange={(event) => {
            setBody(event.target.value);
          }}
        />
        {text ? (
          <div data-swipe-ignore className="flex flex-col gap-3">
            <FacetChipGroup
              label="Роль в треке"
              options={LYRIC_SONG_ROLES}
              labels={LYRIC_SONG_ROLE_LABELS}
              hints={LYRIC_SONG_ROLE_HINTS}
              value={pickKnown(tags.songRole, LYRIC_SONG_ROLES)}
              multiple
              toggleOnClick
              onChange={(songRole) => {
                setTags((current) => ({ ...current, songRole }));
              }}
            />
            <FacetChipGroup
              label="Настроение"
              options={LYRIC_MOODS}
              labels={LYRIC_MOOD_LABELS}
              hints={LYRIC_MOOD_HINTS}
              value={pickKnown(tags.mood, LYRIC_MOODS)}
              multiple
              toggleOnClick
              onChange={(mood) => {
                setTags((current) => ({ ...current, mood }));
              }}
            />
            <FacetChipGroup
              label="Подача"
              options={LYRIC_DELIVERIES}
              labels={LYRIC_DELIVERY_LABELS}
              hints={LYRIC_DELIVERY_HINTS}
              value={pickKnown(tags.delivery, LYRIC_DELIVERIES)}
              multiple
              toggleOnClick
              onChange={(delivery) => {
                setTags((current) => ({ ...current, delivery }));
              }}
            />
            <FacetChipGroup
              label="Энергия"
              options={LYRIC_ENERGIES}
              labels={LYRIC_ENERGY_LABELS}
              hints={LYRIC_ENERGY_HINTS}
              value={pickKnown(
                tags.energy ? [tags.energy] : [],
                LYRIC_ENERGIES
              )}
              multiple={false}
              toggleOnClick
              onChange={(energy) => {
                setTags((current) => ({
                  ...current,
                  energy: energy[0] ?? null,
                }));
              }}
            />
          </div>
        ) : null}
        {error ? <p className="text-destructive text-xs">{error}</p> : null}
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Отмена
          </Button>
          <Button
            type="button"
            disabled={saving || !body.trim()}
            onClick={() => {
              void handleSave();
            }}
          >
            {saving ? <Spinner className="size-4" /> : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
