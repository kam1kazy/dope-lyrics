'use client';

import { useMutation } from '@apollo/client/react';
import { Check, Plus, Sparkles, Trash2, X } from 'lucide-react';
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
} from '@/shared/lib/lyric-facets';
import { cn } from '@/shared/lib/utils/cn';
import { Hint } from '@/shared/ui/hint';
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
  ARTISTS,
  DELETE_ARTIST,
  DRAFT_ARTIST_CARD,
  type IArtist,
  type IArtistCardDraft,
  UPDATE_ARTIST,
} from '../api/queries';
import {
  type ArtistCardForm,
  cardFormFromArtist,
  pickKnown,
  sameCardForm,
  TECHNIQUE_KIND_HINTS,
  TECHNIQUE_KIND_LABELS,
  TECHNIQUE_KINDS,
  TECHNIQUE_LIMIT,
} from '../lib/card';

const FIELD_HINT = 'text-muted-foreground text-[11px] leading-snug';

const fieldClass =
  'border-input bg-background focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2';

export function ArtistCardFormView({
  artist,
  aiEnabled,
  onDeleted,
}: {
  artist: IArtist;
  aiEnabled: boolean;
  onDeleted: () => void;
}) {
  const saved = cardFormFromArtist(artist);
  const [form, setForm] = useState<ArtistCardForm>(saved);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dirty = !sameCardForm(form, saved);

  const [updateArtist, { loading: saving }] = useMutation(UPDATE_ARTIST, {
    refetchQueries: [ARTISTS],
  });
  const [draftCard, { loading: drafting }] = useMutation<{
    draftArtistCard: IArtistCardDraft;
  }>(DRAFT_ARTIST_CARD);
  const [deleteArtist, { loading: deleting }] = useMutation(DELETE_ARTIST, {
    refetchQueries: [ARTISTS],
  });

  const patch = (next: Partial<ArtistCardForm>) => {
    setForm((current) => ({ ...current, ...next }));
  };

  const patchTechnique = (
    index: number,
    next: Partial<ArtistCardForm['techniques'][number]>
  ) => {
    setForm((current) => ({
      ...current,
      techniques: current.techniques.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...next } : item
      ),
    }));
  };

  const handleDraft = async () => {
    setError(null);

    try {
      const { data } = await draftCard({
        variables: { id: artist.id, name: form.name },
      });

      if (data) {
        const draft = data.draftArtistCard;
        setForm({
          name: draft.name,
          moods: draft.moods,
          energies: draft.energies,
          deliveries: draft.deliveries,
          techniques: draft.techniques.map(({ kind, label, instruction }) => ({
            kind,
            label,
            instruction,
          })),
        });
        toast.success('Черновик готов — проверьте и сохраните');
      }
    } catch (caught: unknown) {
      setError(formatQueryError(caught));
    }
  };

  const handleSave = async () => {
    setError(null);

    try {
      await updateArtist({ variables: { id: artist.id, input: form } });
      toast.success('Карточка сохранена');
    } catch (caught: unknown) {
      setError(formatQueryError(caught));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteArtist({ variables: { id: artist.id } });
      setConfirmOpen(false);
      toast.success('Артист удалён');
      onDeleted();
    } catch (caught: unknown) {
      setError(formatQueryError(caught));
      setConfirmOpen(false);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          data-swipe-ignore
          value={form.name}
          maxLength={80}
          aria-label="Имя артиста"
          className="text-base font-medium"
          onChange={(event) => {
            patch({ name: event.target.value });
          }}
        />
        <Hint label="Заполнить с ИИ: поиск в интернете и тексты артиста">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            aria-label="Заполнить с ИИ"
            disabled={!aiEnabled || drafting || !form.name.trim()}
            onClick={() => {
              void handleDraft();
            }}
          >
            {drafting ? (
              <Spinner className="size-4" />
            ) : (
              <Sparkles className="size-4" />
            )}
          </Button>
        </Hint>
        <Hint label="Сохранить карточку">
          <Button
            type="button"
            size="icon"
            className="size-9 shrink-0"
            aria-label="Сохранить карточку"
            disabled={!dirty || saving || !form.name.trim()}
            onClick={() => {
              void handleSave();
            }}
          >
            {saving ? (
              <Spinner className="size-4" />
            ) : (
              <Check className="size-4" />
            )}
          </Button>
        </Hint>
        <Hint label="Удалить артиста">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            aria-label="Удалить артиста"
            onClick={() => {
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </Hint>
      </div>

      {drafting ? (
        <p className="text-muted-foreground text-xs">
          ИИ ищет артиста в интернете, это может занять до минуты…
        </p>
      ) : null}
      {dirty && !drafting ? (
        <p className="text-muted-foreground text-xs">
          Есть несохранённые изменения.
        </p>
      ) : null}

      <div data-swipe-ignore className="flex flex-col gap-3">
        <FacetChipGroup
          label="Настроение"
          options={LYRIC_MOODS}
          labels={LYRIC_MOOD_LABELS}
          hints={LYRIC_MOOD_HINTS}
          value={pickKnown(form.moods, LYRIC_MOODS)}
          multiple
          toggleOnClick
          onChange={(moods) => {
            patch({ moods });
          }}
        />
        <FacetChipGroup
          label="Энергия"
          options={LYRIC_ENERGIES}
          labels={LYRIC_ENERGY_LABELS}
          hints={LYRIC_ENERGY_HINTS}
          value={pickKnown(form.energies, LYRIC_ENERGIES)}
          multiple
          toggleOnClick
          onChange={(energies) => {
            patch({ energies });
          }}
        />
        <FacetChipGroup
          label="Подача"
          options={LYRIC_DELIVERIES}
          labels={LYRIC_DELIVERY_LABELS}
          hints={LYRIC_DELIVERY_HINTS}
          value={pickKnown(form.deliveries, LYRIC_DELIVERIES)}
          multiple
          toggleOnClick
          onChange={(deliveries) => {
            patch({ deliveries });
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs">
            Приёмы · {form.techniques.length} из {TECHNIQUE_LIMIT}
          </span>
          <Hint
            label={
              form.techniques.length >= TECHNIQUE_LIMIT
                ? `Не больше ${TECHNIQUE_LIMIT} приёмов`
                : 'Добавить приём'
            }
          >
            <span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Добавить приём"
                disabled={form.techniques.length >= TECHNIQUE_LIMIT}
                onClick={() => {
                  patch({
                    techniques: [
                      ...form.techniques,
                      { kind: 'IMAGE', label: '', instruction: '' },
                    ],
                  });
                }}
              >
                <Plus className="size-4" />
              </Button>
            </span>
          </Hint>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Приём — то, по чему узнаётся артист. «Поправить ИИ» берёт на каждую
          часть склейки по одному приёму на образ, звук и игру слов у ближайших
          по настроению артистов.
        </p>

        {form.techniques.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Приёмов пока нет. Без них артист не попадёт в «Поправить ИИ».
          </p>
        ) : null}

        {form.techniques.map((item, index) => (
          <div
            key={index}
            data-swipe-ignore
            className="border-border flex flex-col gap-2 rounded-md border p-2"
          >
            <span className={FIELD_HINT}>
              Вид — какую сторону строки меняет приём. «Тон» в правку не уходит.
            </span>
            <div className="flex items-center gap-1">
              <div
                role="radiogroup"
                aria-label="Вид приёма"
                className="bg-muted flex flex-wrap rounded-md p-0.5"
              >
                {TECHNIQUE_KINDS.map((kind) => (
                  <Hint key={kind} label={TECHNIQUE_KIND_HINTS[kind]}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={item.kind === kind}
                      className={cn(
                        'rounded px-2 py-0.5 text-xs',
                        item.kind === kind
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground'
                      )}
                      onClick={() => {
                        patchTechnique(index, { kind });
                      }}
                    >
                      {TECHNIQUE_KIND_LABELS[kind]}
                    </button>
                  </Hint>
                ))}
              </div>
              <Hint label="Убрать приём">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-7"
                  aria-label="Убрать приём"
                  onClick={() => {
                    patch({
                      techniques: form.techniques.filter(
                        (_, itemIndex) => itemIndex !== index
                      ),
                    });
                  }}
                >
                  <X className="size-4" />
                </Button>
              </Hint>
            </div>
            <span className={FIELD_HINT}>
              Ярлык — короткое имя приёма, 2–5 слов. Его видит модель рядом с
              инструкцией.
            </span>
            <Input
              value={item.label}
              maxLength={80}
              placeholder="Ярлык: короткий повтор вместо сюжета"
              aria-label="Ярлык приёма"
              onChange={(event) => {
                patchTechnique(index, { label: event.target.value });
              }}
            />
            <span className={FIELD_HINT}>
              Инструкция — что сделать со строкой и чего не делать. Одна-две
              фразы, без цитат артиста.
            </span>
            <textarea
              value={item.instruction}
              maxLength={500}
              rows={2}
              placeholder="Инструкция: что сделать со строкой и чего не делать"
              aria-label="Инструкция приёма"
              className={cn(fieldClass, 'resize-y')}
              onChange={(event) => {
                patchTechnique(index, { instruction: event.target.value });
              }}
            />
          </div>
        ))}
      </div>

      {error ? <p className="text-destructive text-xs">{error}</p> : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить {artist.name}?</DialogTitle>
            <DialogDescription>
              Карточка и все тексты артиста ({artist.textCount}) пропадут
              насовсем.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={deleting}
              onClick={() => {
                setConfirmOpen(false);
              }}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => {
                void handleDelete();
              }}
            >
              {deleting ? <Spinner className="size-4" /> : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
