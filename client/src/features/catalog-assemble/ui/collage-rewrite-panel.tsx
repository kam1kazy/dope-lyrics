'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { FilePlus, RotateCw, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import {
  assembleTrackFilterFromSection,
  type IAssembledTrackSlot,
} from '@/entities/lyric';
import type { CatalogSectionFilters } from '@/shared/lib/catalog-section-filters';
import { formatQueryError } from '@/shared/lib/format-query-error';
import { useRetainedState } from '@/shared/lib/retained-state';
import { BeforeAfterText } from '@/shared/ui/before-after-text';
import { Hint } from '@/shared/ui/hint';
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
  onResultChange,
}: {
  slots: IAssembledTrackSlot[];
  filters: CatalogSectionFilters;
  hideAdlibs: boolean;
  onSaved: (id: number) => void;
  onResultChange: (active: boolean) => void;
}) {
  const storeKey = JSON.stringify(slotsToInput(slots));
  const [theme, setTheme] = useRetainedState(`rewrite-theme:${storeKey}`, '');
  const [result, setResult] = useRetainedState<ICollageRewrite | null>(
    `rewrite-result:${storeKey}`,
    null
  );
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

  const hasResult = result !== null;
  useEffect(() => {
    onResultChange(hasResult);
    return () => {
      onResultChange(false);
    };
  }, [hasResult, onResultChange]);

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
        <div className="flex flex-col gap-2">
          <BeforeAfterText
            key={result.usageId}
            before={result.sourceText}
            after={result.aiText}
            onAfterChange={(aiText) => {
              setResult({ ...result, aiText });
            }}
            actions={
              <>
                <Hint label="Ещё раз">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label="Ещё раз"
                    disabled={rewriting || saving}
                    onClick={() => {
                      void handleRewrite();
                    }}
                  >
                    {rewriting ? (
                      <Spinner className="size-4" />
                    ) : (
                      <RotateCw className="size-4" />
                    )}
                  </Button>
                </Hint>
                <Hint label="Сохранить в тексты">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label="Сохранить в тексты"
                    disabled={rewriting || saving}
                    onClick={() => {
                      void handleSave();
                    }}
                  >
                    {saving ? (
                      <Spinner className="size-4" />
                    ) : (
                      <FilePlus className="size-4" />
                    )}
                  </Button>
                </Hint>
              </>
            }
          />
        </div>
      ) : null}
    </div>
  );
}
