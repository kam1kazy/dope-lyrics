'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  assembleTrackFilterFromSection,
  type IAssembledTrackSlot,
} from '@/entities/lyric';
import type { CatalogSectionFilters } from '@/shared/lib/catalog-section-filters';
import { formatQueryError } from '@/shared/lib/format-query-error';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  AI_STATUS,
  CREATE_TRACK_TEXT,
  type ICollageRewrite,
  REWRITE_COLLAGE,
} from '../api/ai-queries';

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

export function CollageRewritePanel({
  slots,
  filters,
  hideAdlibs,
  onSaved,
}: {
  slots: IAssembledTrackSlot[];
  filters: CatalogSectionFilters;
  hideAdlibs: boolean;
  onSaved: (id: number) => void;
}) {
  const [theme, setTheme] = useState('');
  const [result, setResult] = useState<ICollageRewrite | null>(null);
  const { data: status } = useQuery<{ aiStatus: { enabled: boolean } }>(
    AI_STATUS
  );
  const [rewrite, { loading: rewriting, error: rewriteError }] = useMutation<
    { rewriteCollage: ICollageRewrite },
    {
      slots: ReturnType<typeof slotsToInput>;
      theme: string | null;
      filter: ReturnType<typeof assembleTrackFilterFromSection>;
      hideAdlibs: boolean;
    }
  >(REWRITE_COLLAGE, { refetchQueries: ['AiSettings'] });
  const [createText, { loading: saving, error: saveError }] = useMutation<
    { createTrackText: { id: number } },
    {
      slots: ReturnType<typeof slotsToInput>;
      theme: string | null;
      aiText: string;
      usageId: number;
      hideAdlibs: boolean;
    }
  >(CREATE_TRACK_TEXT, { refetchQueries: ['TrackTexts'] });

  const enabled = status?.aiStatus.enabled === true;
  const hasLines = slots.some((slot) => slot.parts.length > 0);
  const trimmedTheme = theme.trim() || null;

  const handleRewrite = async () => {
    const response = await rewrite({
      variables: {
        slots: slotsToInput(slots),
        theme: trimmedTheme,
        filter: assembleTrackFilterFromSection(filters),
        hideAdlibs,
      },
    }).catch(() => null);

    if (response?.data) {
      setResult(response.data.rewriteCollage);
    }
  };

  const handleSave = async () => {
    if (!result) {
      return;
    }

    const response = await createText({
      variables: {
        slots: slotsToInput(slots),
        theme: trimmedTheme,
        aiText: result.aiText,
        usageId: result.usageId,
        hideAdlibs,
      },
    }).catch(() => null);

    const id = response?.data?.createTrackText.id;
    if (id === undefined) {
      return;
    }

    setResult(null);
    toast.success('Текст сохранён');
    onSaved(id);
  };

  const error = rewriteError ?? saveError;

  return (
    <div className="flex flex-col gap-2" data-swipe-ignore>
      <div className="flex items-center gap-2">
        <Input
          value={theme}
          placeholder="Тема трека"
          className="h-8"
          onChange={(event) => {
            setTheme(event.target.value);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          disabled={!enabled || !hasLines || rewriting}
          onClick={() => {
            void handleRewrite();
          }}
        >
          {rewriting ? (
            <Spinner className="size-4" />
          ) : (
            <>
              <Sparkles className="size-4" />
              Поправить ИИ
            </>
          )}
        </Button>
      </div>
      {status && !enabled ? (
        <p className="text-muted-foreground text-xs">ИИ не настроен</p>
      ) : null}
      {error ? (
        <p className="text-destructive text-xs">{formatQueryError(error)}</p>
      ) : null}
      {result ? (
        <div className="border-border flex flex-col gap-2 rounded-md border p-3">
          <p className="text-sm whitespace-pre-wrap">{result.aiText}</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={rewriting || saving}
              onClick={() => {
                void handleRewrite();
              }}
            >
              Ещё раз
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={rewriting || saving}
              onClick={() => {
                void handleSave();
              }}
            >
              {saving ? <Spinner className="size-4" /> : 'Сохранить'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
