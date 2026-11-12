'use client';

import { useMutation } from '@apollo/client/react';
import { useState } from 'react';

import { formatQueryError } from '@/shared/lib/format-query-error';
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

import { type IReferenceText, UPDATE_REFERENCE_TEXT } from '../api/queries';
import { referenceTextTitle } from '../lib/text-title';

export function ReferenceNoteDialog({
  text,
  open,
  onOpenChange,
}: {
  text: IReferenceText;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [note, setNote] = useState(text.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [updateText, { loading }] = useMutation(UPDATE_REFERENCE_TEXT);

  const handleSave = async () => {
    setError(null);

    try {
      await updateText({ variables: { id: text.id, input: { note } } });
      onOpenChange(false);
    } catch (caught: unknown) {
      setError(formatQueryError(caught));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Почему это круто</DialogTitle>
          <DialogDescription>
            {referenceTextTitle(text)} — что нравится. Пояснение уходит в
            «Поправить ИИ» рядом с текстом.
          </DialogDescription>
        </DialogHeader>
        <textarea
          data-swipe-ignore
          value={note}
          rows={6}
          maxLength={2000}
          autoFocus
          placeholder="Например: ленивый флоу, а панч прилетает в последнем слове"
          aria-label="Пояснение"
          className="border-input bg-background focus-visible:ring-ring/50 w-full resize-y rounded-md border p-3 text-sm outline-none focus-visible:ring-2"
          onChange={(event) => {
            setNote(event.target.value);
          }}
        />
        {error ? <p className="text-destructive text-xs">{error}</p> : null}
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Отмена
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => {
              void handleSave();
            }}
          >
            {loading ? <Spinner className="size-4" /> : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
