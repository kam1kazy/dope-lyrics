'use client';

import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { TrackFormQuotas } from '@/entities/lyric';
import type { ScratchTextGeneration } from '@/features/track-texts';
import type { ReferenceFilter } from '@/shared/lib/reference-filter';
import { useRetainedState } from '@/shared/lib/retained-state';

import {
  CREATE_SCRATCH_TRACK_TEXT,
  type IScratchResult,
  WRITE_FROM_SCRATCH,
} from '../api/queries';

export type ScratchFacets = ScratchTextGeneration['facets'];

export type ScratchRequest = {
  theme: string;
  form: TrackFormQuotas;
  facets: ScratchFacets;
  references: ReferenceFilter;
};

export type ScratchAnswer = IScratchResult & { request: ScratchRequest };

/** Один прогон «С нуля»: вызов модели и сохранение в тексты. Форма и правая панель читают его вместе. */
export function useScratchSession(onSaved: (id: number) => void) {
  const [answer, setAnswer] = useRetainedState<ScratchAnswer | null>(
    'scratch-answer',
    null
  );
  const [paneOpen, setPaneOpen] = useState(false);
  const [write, { loading: writing, error: writeError }] = useMutation<
    { writeFromScratch: IScratchResult },
    ScratchRequest
  >(WRITE_FROM_SCRATCH, { refetchQueries: ['AiSettings'] });
  const [createText, { loading: saving, error: saveError }] = useMutation<
    { createScratchTrackText: { id: number } },
    { theme: string; aiText: string; usageId: number; generation: string }
  >(CREATE_SCRATCH_TRACK_TEXT, { refetchQueries: ['TrackTexts'] });

  const handleWrite = async (request: ScratchRequest) => {
    setPaneOpen(true);
    const response = await write({ variables: request }).catch(() => null);
    const result = response?.data?.writeFromScratch;

    if (result) {
      setAnswer({ ...result, request });
    }
  };

  const handleSave = async () => {
    if (!answer) {
      return;
    }

    const generation = {
      kind: 'scratch',
      form: answer.request.form,
      facets: answer.request.facets,
      references: answer.request.references,
      picked: answer.sources.map(({ textId, artistName, title }) => ({
        textId,
        artistName,
        title,
      })),
    } satisfies ScratchTextGeneration;
    const response = await createText({
      variables: {
        theme: answer.request.theme,
        aiText: answer.aiText,
        usageId: answer.usageId,
        generation: JSON.stringify(generation),
      },
    }).catch(() => null);

    const id = response?.data?.createScratchTrackText.id;
    if (id === undefined) {
      return;
    }

    setAnswer(null);
    setPaneOpen(false);
    toast.success('Текст сохранён');
    onSaved(id);
  };

  return {
    answer,
    writing,
    saving,
    error: writeError ?? saveError,
    paneOpen: paneOpen && (answer !== null || writing),
    closePane: () => {
      setPaneOpen(false);
    },
    write: handleWrite,
    save: handleSave,
  };
}

export type ScratchSession = ReturnType<typeof useScratchSession>;
