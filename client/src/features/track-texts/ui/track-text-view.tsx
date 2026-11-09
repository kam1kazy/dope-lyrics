'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { formatRuDateTime } from '@/shared/lib/format-datetime';
import { cn } from '@/shared/lib/utils/cn';
import { ErrorText } from '@/shared/ui/error-text';
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
  const [draft, setDraft] = useState<string | null>(null);
  const [tab, setTab] = useState<SnapshotTab>('final');
  const [seamOn, setSeamOn] = useState(true);

  useEffect(() => {
    setDraft(null);
    setTab('final');
  }, [id]);

  useEffect(() => {
    setSeamOn(window.localStorage.getItem(SEAM_STORAGE_KEY) !== 'off');
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
  const shownFinal = row.finalText ?? row.text;

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
          {row.theme ?? 'Без темы'} · {formatRuDateTime(row.createdAt)}
          {row.doneAt ? ' · готово' : ''}
        </h3>
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
      </div>

      <textarea
        data-swipe-ignore
        value={value}
        rows={12}
        className="border-input bg-background focus-visible:ring-ring/50 w-full resize-y rounded-md border p-3 text-sm outline-none focus-visible:ring-2"
        onChange={(event) => {
          setDraft(event.target.value);
        }}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!dirty || saving || marking}
          onClick={() => {
            void handleSave();
          }}
        >
          {saving ? <Spinner className="size-4" /> : 'Сохранить'}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={saving || marking || value.trim().length === 0}
          onClick={() => {
            void handleDone();
          }}
        >
          {marking ? <Spinner className="size-4" /> : 'Готово'}
        </Button>
      </div>
      {saveError || doneError ? (
        <p className="text-destructive text-xs">
          Не удалось сохранить, попробуйте ещё раз
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          {(Object.keys(TAB_LABELS) as SnapshotTab[]).map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={tab === key ? 'secondary' : 'ghost'}
              onClick={() => {
                setTab(key);
              }}
            >
              {TAB_LABELS[key]}
            </Button>
          ))}
          {tab === 'final' ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn('ml-auto', !seamOn && 'text-muted-foreground')}
              aria-pressed={seamOn}
              onClick={toggleSeam}
            >
              Шов
            </Button>
          ) : null}
        </div>
        <div className="border-border rounded-md border p-3">
          {tab === 'source' ? (
            <p className="text-sm whitespace-pre-wrap">{row.sourceText}</p>
          ) : tab === 'ai' ? (
            <p className="text-sm whitespace-pre-wrap">{row.aiText}</p>
          ) : (
            <SeamText
              source={row.sourceText}
              ai={row.aiText}
              final={shownFinal}
              enabled={seamOn}
            />
          )}
        </div>
        {tab === 'final' && !row.finalText ? (
          <p className="text-muted-foreground text-xs">
            Пока «Готово» не нажато, здесь рабочая версия.
          </p>
        ) : null}
      </div>
    </div>
  );
}
