'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { FilePlus, PenLine, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import {
  assembleTrackFilterFromSection,
  type IAssembledTrackSlot,
} from '@/entities/lyric';
import type { CatalogSectionFilters } from '@/shared/lib/catalog-section-filters';
import { formatQueryError } from '@/shared/lib/format-query-error';
import { useRetainedState } from '@/shared/lib/retained-state';
import { BeforeAfterText, type LineMark } from '@/shared/ui/before-after-text';
import { Hint } from '@/shared/ui/hint';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  AI_STATUS,
  CREATE_TRACK_TEXT,
  type ICollageRewrite,
  type ILineMarksRevision,
  REVISE_MARKED_LINES,
  REWRITE_COLLAGE,
} from '../api/ai-queries';

const NEXT_MARK: Record<'none' | LineMark, LineMark | null> = {
  none: 'red',
  red: 'green',
  green: null,
};

const MARK_INPUT: Record<LineMark, 'RED' | 'GREEN'> = {
  red: 'RED',
  green: 'GREEN',
};

const withoutRed = (
  marks: ReadonlyMap<number, LineMark>
): ReadonlyMap<number, LineMark> =>
  new Map([...marks].filter(([, mark]) => mark === 'green'));

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
  const [marks, setMarks] = useRetainedState<ReadonlyMap<number, LineMark>>(
    `rewrite-marks:${storeKey}`,
    new Map()
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
  const [revise, { loading: revising, error: reviseError }] = useMutation<
    { reviseMarkedLines: ILineMarksRevision },
    {
      aiText: string;
      marks: { line: number; mark: 'RED' | 'GREEN' }[];
      theme: string | null;
    }
  >(REVISE_MARKED_LINES, { refetchQueries: ['AiSettings'] });
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
      setMarks(new Map());
    }
  };

  const hasRed = [...marks.values()].includes('red');
  const busy = rewriting || revising || saving;

  const toggleMark = (line: number) => {
    setMarks((current) => {
      const next = new Map(current);
      const mark = NEXT_MARK[current.get(line) ?? 'none'];
      if (mark) {
        next.set(line, mark);
      } else {
        next.delete(line);
      }

      return next;
    });
  };

  const handleRevise = async () => {
    if (!result || !hasRed) {
      return;
    }

    const response = await revise({
      variables: {
        aiText: result.aiText,
        marks: [...marks].map(([line, mark]) => ({
          line,
          mark: MARK_INPUT[mark],
        })),
        theme: trimmedTheme,
      },
    }).catch(() => null);

    const revision = response?.data?.reviseMarkedLines;
    if (!revision) {
      return;
    }

    setResult({ ...result, ...revision });
    setMarks(withoutRed);
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
    setMarks(new Map());
    toast.success('Текст сохранён');
    onSaved(id);
  };

  const error = rewriteError ?? reviseError ?? saveError;

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
        <Hint label="Поправить ИИ">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8 shrink-0"
            aria-label="Поправить ИИ"
            disabled={!enabled || !hasLines || busy}
            onClick={() => {
              void handleRewrite();
            }}
          >
            {rewriting ? (
              <Spinner className="size-4" />
            ) : (
              <Sparkles className="size-4" />
            )}
          </Button>
        </Hint>
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
            marks={marks}
            onToggleMark={toggleMark}
            actions={
              <>
                <Hint
                  label={
                    hasRed
                      ? 'Внести правки: переписать красные строки'
                      : 'Внести правки: отметьте красным строки, которые переделать'
                  }
                >
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label="Внести правки"
                    disabled={!hasRed || busy}
                    onClick={() => {
                      void handleRevise();
                    }}
                  >
                    {revising ? (
                      <Spinner className="size-4" />
                    ) : (
                      <PenLine className="size-4" />
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
                    disabled={busy}
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
