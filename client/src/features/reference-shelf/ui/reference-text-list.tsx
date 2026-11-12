'use client';

import { useMutation } from '@apollo/client/react';
import { MessageCircle, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { formatQueryError } from '@/shared/lib/format-query-error';
import {
  LYRIC_DELIVERY_LABELS,
  LYRIC_ENERGY_LABELS,
  LYRIC_MOOD_LABELS,
  LYRIC_SONG_ROLE_LABELS,
} from '@/shared/lib/lyric-facets';
import { cn } from '@/shared/lib/utils/cn';
import { Hint } from '@/shared/ui/hint';
import { Badge } from '@/shared/ui/shadcn/ui/badge';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/ui/dialog';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  ARTIST,
  ARTISTS,
  DELETE_REFERENCE_TEXT,
  type IReferenceText,
  TAG_REFERENCE_TEXT,
} from '../api/queries';
import { referenceTextTitle } from '../lib/text-title';
import { ReferenceNoteDialog } from './reference-note-dialog';
import { ReferenceTextDialog } from './reference-text-dialog';

const PREVIEW_LINES = 3;

const labelOf = (labels: Record<string, string>, value: string) =>
  labels[value] ?? value;

const tagLabels = (text: IReferenceText): string[] => [
  ...text.songRole.map((value) => labelOf(LYRIC_SONG_ROLE_LABELS, value)),
  ...text.mood.map((value) => labelOf(LYRIC_MOOD_LABELS, value)),
  ...text.delivery.map((value) => labelOf(LYRIC_DELIVERY_LABELS, value)),
  ...(text.energy ? [labelOf(LYRIC_ENERGY_LABELS, text.energy)] : []),
];

type EditState = { open: boolean; text: IReferenceText | null; key: number };

export function ReferenceTextList({
  artistId,
  texts,
  aiEnabled,
}: {
  artistId: number;
  texts: IReferenceText[];
  aiEnabled: boolean;
}) {
  const [edit, setEdit] = useState<EditState>({
    open: false,
    text: null,
    key: 0,
  });
  const [noteFor, setNoteFor] = useState<IReferenceText | null>(null);
  const [deleteFor, setDeleteFor] = useState<IReferenceText | null>(null);
  const [tagging, setTagging] = useState<ReadonlySet<number>>(new Set());
  const [tagTextMutation] = useMutation(TAG_REFERENCE_TEXT);
  const [deleteText, { loading: deleting }] = useMutation(
    DELETE_REFERENCE_TEXT,
    { refetchQueries: [ARTISTS, ARTIST] }
  );

  const openEditor = (text: IReferenceText | null) => {
    setEdit((current) => ({ open: true, text, key: current.key + 1 }));
  };

  const tagText = async (id: number) => {
    if (!aiEnabled) {
      return;
    }

    setTagging((current) => new Set(current).add(id));

    try {
      await tagTextMutation({ variables: { id } });
    } catch (caught: unknown) {
      toast.error(`Теги не поставились: ${formatQueryError(caught)}`);
    } finally {
      setTagging((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteFor) {
      return;
    }

    try {
      await deleteText({ variables: { id: deleteFor.id } });
      setDeleteFor(null);
    } catch (caught: unknown) {
      toast.error(formatQueryError(caught));
    }
  };

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Тексты · {texts.length}</h3>
        <Hint label="Добавить текст">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Добавить текст"
            onClick={() => {
              openEditor(null);
            }}
          >
            <Plus className="size-4" />
          </Button>
        </Hint>
      </div>

      {texts.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Текстов пока нет. Добавьте куплет или хук, который нравится, — он
          пойдёт в «Поправить ИИ» примером.
        </p>
      ) : null}

      {texts.map((text) => {
        const isTagging = tagging.has(text.id);
        const labels = tagLabels(text);
        const hasNote = Boolean(text.note?.trim());

        return (
          <article
            key={text.id}
            className="border-border flex flex-col gap-2 rounded-md border p-3"
          >
            <div className="flex items-start gap-1">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  openEditor(text);
                }}
              >
                <p className="truncate text-sm font-medium">
                  {referenceTextTitle(text)}
                </p>
                <p className="text-muted-foreground line-clamp-3 text-xs whitespace-pre-line">
                  {text.text.split('\n').slice(0, PREVIEW_LINES).join('\n')}
                </p>
              </button>
              <Hint label={hasNote ? 'Почему круто' : 'Написать, почему круто'}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="Пояснение"
                  aria-pressed={hasNote}
                  onClick={() => {
                    setNoteFor(text);
                  }}
                >
                  <MessageCircle
                    className={cn('size-4', hasNote && 'fill-current')}
                  />
                </Button>
              </Hint>
              <Hint label="Изменить текст">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="Изменить текст"
                  onClick={() => {
                    openEditor(text);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
              </Hint>
              <Hint label="Удалить текст">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="Удалить текст"
                  onClick={() => {
                    setDeleteFor(text);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </Hint>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {isTagging ? (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Spinner className="size-3" /> ИИ ставит теги…
                </span>
              ) : (
                <>
                  {labels.map((label, index) => (
                    <Badge
                      key={`${label}-${index}`}
                      variant="outline"
                      className="px-1.5 py-0 text-[11px] font-normal"
                    >
                      {label}
                    </Badge>
                  ))}
                  {!text.tagged ? (
                    <Hint label="Поставить теги ИИ">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 gap-1 px-2 text-xs"
                        aria-label="Поставить теги"
                        disabled={!aiEnabled}
                        onClick={() => {
                          void tagText(text.id);
                        }}
                      >
                        <Tags className="size-3" />
                        {labels.length > 0 ? 'Обновить теги' : 'Поставить теги'}
                      </Button>
                    </Hint>
                  ) : null}
                </>
              )}
            </div>
          </article>
        );
      })}

      {edit.open ? (
        <ReferenceTextDialog
          key={edit.key}
          artistId={artistId}
          text={edit.text}
          open={edit.open}
          onOpenChange={(open) => {
            setEdit((current) => ({ ...current, open }));
          }}
          onNeedsTags={(id) => {
            void tagText(id);
          }}
        />
      ) : null}

      {noteFor ? (
        <ReferenceNoteDialog
          key={noteFor.id}
          text={noteFor}
          open
          onOpenChange={(open) => {
            if (!open) {
              setNoteFor(null);
            }
          }}
        />
      ) : null}

      <Dialog
        open={deleteFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteFor(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить текст?</DialogTitle>
            <DialogDescription>
              {deleteFor ? referenceTextTitle(deleteFor) : ''} и пояснение к
              нему пропадут насовсем.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={deleting}
              onClick={() => {
                setDeleteFor(null);
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
