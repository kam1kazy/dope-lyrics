'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { Check, Highlighter, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { formatRuDateTime } from '@/shared/lib/format-datetime';
import { useRetainedState } from '@/shared/lib/retained-state';
import { cn } from '@/shared/lib/utils/cn';
import { BeforeAfterText } from '@/shared/ui/before-after-text';
import { ErrorText } from '@/shared/ui/error-text';
import { Hint } from '@/shared/ui/hint';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  type ITrackText,
  MARK_TRACK_TEXT_DONE,
  TRACK_TEXT,
  TRACK_TEXTS,
  UPDATE_TRACK_TEXT,
} from '../api/queries';
import { buildSeam, SEAM_STORAGE_KEY } from '../lib/seam';
import { trackTextTitle } from '../lib/title';

type SnapshotTab = 'source' | 'ai' | 'final';

const TAB_LABELS: Record<SnapshotTab, string> = {
  source: 'Из моих',
  ai: 'ИИ',
  final: 'Финал',
};

const SEAM_CLASSES = {
  plain: '',
  ai: 'bg-yellow-400/25',
  author: 'bg-emerald-400/25',
} as const;

function SeamText({
  source,
  ai,
  final,
  enabled,
}: {
  source: string;
  ai: string;
  final: string;
  enabled: boolean;
}) {
  const segments = useMemo(
    () => (enabled ? buildSeam(source, ai, final) : []),
    [enabled, source, ai, final]
  );

  if (!enabled) {
    return <p className="text-sm whitespace-pre-wrap">{final}</p>;
  }

  return (
    <p className="text-sm whitespace-pre-wrap">
      {segments.map((segment, index) => (
        <span key={index} className={SEAM_CLASSES[segment.kind]}>
          {segment.text}
        </span>
      ))}
    </p>
  );
}

export function TrackTextView({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  const { data, loading, error } = useQuery<{ trackText: ITrackText }>(
    TRACK_TEXT,
    { variables: { id }, fetchPolicy: 'cache-and-network' }
  );
  const [updateText, { loading: saving, error: saveError }] =
    useMutation(UPDATE_TRACK_TEXT);
  const [markDone, { loading: marking, error: doneError }] = useMutation(
    MARK_TRACK_TEXT_DONE,
    { refetchQueries: [TRACK_TEXTS] }
  );
  const [drafts, setDrafts] = useRetainedState<Record<number, string>>(
    'track-text-drafts',
    {}
  );
  const draft = drafts[id] ?? null;
  const setDraft = (next: string | null) => {
    setDrafts((current) => {
      const { [id]: _removed, ...rest } = current;
      return next === null ? rest : { ...rest, [id]: next };
    });
  };
  const [tab, setTab] = useState<SnapshotTab>('final');
  const [seamOn, setSeamOn] = useState(false);

  useEffect(() => {
    setTab('final');
  }, [id]);

  useEffect(() => {
    setSeamOn(window.localStorage.getItem(SEAM_STORAGE_KEY) === 'on');
  }, []);

  const row = data?.trackText;

  if (!row) {
    if (error) {
      return <ErrorText title="Не удалось открыть текст" error={error} />;
    }

    return (
      <div className="flex justify-center p-8">
        {loading ? <Spinner className="size-5" /> : null}
      </div>
    );
  }

  const value = draft ?? row.text;
  const dirty = value !== row.text;

  const handleSave = async () => {
    await updateText({ variables: { id, text: value } });
    setDraft(null);
    toast.success('Текст сохранён');
  };

  const handleDone = async () => {
    if (dirty) {
      await updateText({ variables: { id, text: value } });
      setDraft(null);
    }

    await markDone({ variables: { id } });
    toast.success('Текст отмечен готовым');
  };

  const toggleSeam = () => {
    const next = !seamOn;
    setSeamOn(next);
    window.localStorage.setItem(SEAM_STORAGE_KEY, next ? 'on' : 'off');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium">
          {trackTextTitle({ theme: row.theme, text: row.text })} ·{' '}
          {formatRuDateTime(row.createdAt)}
          {row.doneAt ? ' · готово' : ''}
        </h3>
        <Hint label="Закрыть">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </Hint>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          {(Object.keys(TAB_LABELS) as SnapshotTab[]).map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                'h-8 px-0 hover:bg-transparent',
                tab === key
                  ? 'text-foreground underline underline-offset-4'
                  : 'text-muted-foreground'
              )}
              aria-pressed={tab === key}
              onClick={() => {
                setTab(key);
              }}
            >
              {TAB_LABELS[key]}
            </Button>
          ))}
          {tab === 'final' ? (
            <div className="ml-auto flex items-center gap-1">
              <Hint label="Шов: слова ИИ и автора">
                <Button
                  type="button"
                  size="icon"
                  variant={seamOn ? 'secondary' : 'ghost'}
                  className="size-8"
                  aria-label="Шов: слова ИИ и автора"
                  aria-pressed={seamOn}
                  onClick={toggleSeam}
                >
                  <Highlighter className="size-4" />
                </Button>
              </Hint>
              <Hint label="Сохранить">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label="Сохранить"
                  disabled={!dirty || saving || marking}
                  onClick={() => {
                    void handleSave();
                  }}
                >
                  {saving ? (
                    <Spinner className="size-4" />
                  ) : (
                    <Save className="size-4" />
                  )}
                </Button>
              </Hint>
              <Hint label="Готово">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label="Готово"
                  disabled={saving || marking || value.trim().length === 0}
                  onClick={() => {
                    void handleDone();
                  }}
                >
                  {marking ? (
                    <Spinner className="size-4" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </Button>
              </Hint>
            </div>
          ) : null}
        </div>
        {saveError || doneError ? (
          <p className="text-destructive text-xs">
            Не удалось сохранить, попробуйте ещё раз
          </p>
        ) : null}
        {tab === 'final' ? (
          seamOn ? (
            <SeamText
              source={row.sourceText}
              ai={row.aiText}
              final={value}
              enabled
            />
          ) : (
            <textarea
              data-swipe-ignore
              value={value}
              rows={12}
              className="border-input bg-background focus-visible:ring-ring/50 w-full resize-y rounded-md border p-3 text-sm outline-none focus-visible:ring-2"
              onChange={(event) => {
                setDraft(event.target.value);
              }}
            />
          )
        ) : (
          <BeforeAfterText
            before={row.sourceText}
            after={row.aiText}
            side={tab === 'source' ? 'before' : 'after'}
          />
        )}
        {tab === 'final' && !row.finalText ? (
          <p className="text-muted-foreground text-xs">
            Пока «Готово» не нажато, это рабочая версия.
          </p>
        ) : null}
      </div>
    </div>
  );
}
