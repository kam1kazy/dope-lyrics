'use client';

import { useMutation } from '@apollo/client/react';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { formatQueryError } from '@/shared/lib/format-query-error';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  AI_SETTINGS,
  CREATE_AI_PROMPT,
  type IAiPromptMeta,
  type IAiPromptVersion,
  SUGGEST_AI_PROMPT_META,
} from '../api/queries';
import { versionTitle } from '../lib/format';
import { VersionList } from './version-list';

const RECENT_VERSIONS = 4;

export function PromptTab({
  current,
  versions,
  aiEnabled,
}: {
  current: IAiPromptVersion | null;
  versions: IAiPromptVersion[];
  aiEnabled: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [createPrompt, { loading: saving }] = useMutation(CREATE_AI_PROMPT, {
    refetchQueries: [AI_SETTINGS],
  });
  const [suggestMeta, { loading: suggesting }] = useMutation<{
    suggestAiPromptMeta: IAiPromptMeta;
  }>(SUGGEST_AI_PROMPT_META);

  const value = draft ?? current?.text ?? '';

  const handleSuggest = async () => {
    setError(null);

    try {
      const { data } = await suggestMeta({ variables: { text: value } });

      if (data) {
        setName(data.suggestAiPromptMeta.name);
        setDescription(data.suggestAiPromptMeta.description);
      }
    } catch (caught: unknown) {
      setError(formatQueryError(caught));
    }
  };

  const handleCreate = async () => {
    setError(null);

    try {
      await createPrompt({
        variables: { text: value, name, description },
      });
      setDraft(null);
      setCreating(false);
      setName('');
      setDescription('');
      toast.success('Новый промпт создан');
    } catch (caught: unknown) {
      setError(formatQueryError(caught));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium">
            {current
              ? `Версия ${current.number} · ${versionTitle(current)}`
              : 'Промпта ещё нет'}
          </h3>
          {current?.description ? (
            <p className="text-muted-foreground text-xs">
              {current.description}
            </p>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">
          Голос и правила. Формат ответа задаёт система, его тут писать не
          нужно.
        </p>
        <textarea
          data-swipe-ignore
          value={value}
          rows={8}
          className="border-input bg-background focus-visible:ring-ring/50 w-full resize-y rounded-md border p-3 text-sm outline-none focus-visible:ring-2"
          placeholder="Например: пиши жёстко, без морали в конце куплета"
          onChange={(event) => {
            setDraft(event.target.value);
          }}
        />

        {creating ? (
          <div className="border-border flex flex-col gap-2 rounded-md border p-3">
            <Input
              data-swipe-ignore
              value={name}
              maxLength={80}
              placeholder="Название"
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
            <Input
              data-swipe-ignore
              value={description}
              maxLength={300}
              placeholder="Описание: чем эта версия отличается"
              onChange={(event) => {
                setDescription(event.target.value);
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!aiEnabled || !value.trim() || suggesting}
                onClick={() => {
                  void handleSuggest();
                }}
              >
                {suggesting ? (
                  <Spinner className="size-4" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Придумать ИИ
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!name.trim() || saving}
                onClick={() => {
                  void handleCreate();
                }}
              >
                {saving ? <Spinner className="size-4" /> : 'Создать'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                  setError(null);
                }}
              >
                Отмена
              </Button>
            </div>
            {!aiEnabled ? (
              <p className="text-muted-foreground text-xs">ИИ не настроен</p>
            ) : null}
          </div>
        ) : (
          <div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setCreating(true);
              }}
            >
              Создать новый промпт
            </Button>
          </div>
        )}
        {error ? <p className="text-destructive text-xs">{error}</p> : null}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">Последние версии</p>
        <VersionList
          versions={versions.slice(0, RECENT_VERSIONS)}
          currentId={current?.id}
        />
      </section>
    </div>
  );
}
