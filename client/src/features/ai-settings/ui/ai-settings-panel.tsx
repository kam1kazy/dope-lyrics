'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { formatRuDateTime } from '@/shared/lib/format-datetime';
import { ErrorText } from '@/shared/ui/error-text';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  AI_SETTINGS,
  type IAiPromptVersion,
  type IAiUsageItem,
  type IAiUsagePeriod,
  type IAiUsageSummary,
  SAVE_AI_PROMPT,
} from '../api/queries';

type SettingsData = {
  aiStatus: { enabled: boolean };
  aiPrompt: IAiPromptVersion | null;
  aiPromptVersions: IAiPromptVersion[];
  aiUsageSummary: IAiUsageSummary;
  aiUsageRecent: IAiUsageItem[];
};

const PERIODS: { key: keyof IAiUsageSummary; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'month', label: '30 дней' },
  { key: 'all', label: 'Всё время' },
];

const formatRub = (value: number | null): string =>
  value === null ? '—' : `${value.toFixed(2)} ₽`;

const formatTokens = (value: number): string => value.toLocaleString('ru-RU');

const KIND_LABELS: Record<string, string> = {
  COLLAGE_REWRITE: 'Правка склейки',
};

function UsagePeriod({
  label,
  period,
}: {
  label: string;
  period: IAiUsagePeriod;
}) {
  return (
    <div className="border-border flex flex-col gap-1 rounded-md border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium">{formatRub(period.costRub)}</p>
      <p className="text-muted-foreground text-xs">
        {period.requests} запр. · {formatTokens(period.tokensIn)} →{' '}
        {formatTokens(period.tokensOut)} ток.
      </p>
    </div>
  );
}

export function AiSettingsPanel() {
  const { data, loading, error } = useQuery<SettingsData>(AI_SETTINGS, {
    fetchPolicy: 'cache-and-network',
  });
  const [draft, setDraft] = useState<string | null>(null);
  const [viewedVersion, setViewedVersion] = useState<IAiPromptVersion | null>(
    null
  );
  const [savePrompt, { loading: saving, error: saveError }] = useMutation(
    SAVE_AI_PROMPT,
    { refetchQueries: [AI_SETTINGS] }
  );

  if (loading && !data) {
    return (
      <div className="flex justify-center p-8">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorText title="Не удалось открыть настройки ИИ" error={error} />;
  }

  const current = data.aiPrompt?.text ?? '';
  const value = draft ?? current;
  const dirty = value !== current;

  const handleSave = async () => {
    await savePrompt({ variables: { text: value } });
    setDraft(null);
    toast.success('Промпт сохранён');
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {!data.aiStatus.enabled ? (
        <p className="border-border text-muted-foreground rounded-md border p-3 text-sm">
          ИИ не настроен: на сервере не задан ключ провайдера.
        </p>
      ) : null}

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Промпт</h3>
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
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!dirty || saving}
            onClick={() => {
              void handleSave();
            }}
          >
            {saving ? <Spinner className="size-4" /> : 'Сохранить'}
          </Button>
          {saveError ? (
            <p className="text-destructive text-xs">Не удалось сохранить</p>
          ) : null}
        </div>

        {data.aiPromptVersions.length > 0 ? (
          <div className="flex flex-col gap-1 pt-2">
            <p className="text-muted-foreground text-xs">Версии</p>
            {data.aiPromptVersions.map((version, index) => (
              <Button
                key={version.id}
                type="button"
                variant={
                  viewedVersion?.id === version.id ? 'secondary' : 'ghost'
                }
                size="sm"
                className="justify-start"
                onClick={() => {
                  setViewedVersion(
                    viewedVersion?.id === version.id ? null : version
                  );
                }}
              >
                {formatRuDateTime(version.createdAt)}
                {index === 0 ? ' · текущая' : ''}
              </Button>
            ))}
            {viewedVersion ? (
              <pre className="border-border mt-1 rounded-md border p-3 text-sm whitespace-pre-wrap">
                {viewedVersion.text || '(пусто)'}
              </pre>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Расход (оценка)</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {PERIODS.map(({ key, label }) => (
            <UsagePeriod
              key={key}
              label={label}
              period={data.aiUsageSummary[key]}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Последние запросы</h3>
        {data.aiUsageRecent.length === 0 ? (
          <p className="text-muted-foreground text-sm">Запросов ещё не было</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.aiUsageRecent.map((item) => (
              <li
                key={item.id}
                className="border-border flex flex-col gap-0.5 rounded-md border p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{KIND_LABELS[item.kind] ?? item.kind}</span>
                  <span
                    className={
                      item.status === 'OK'
                        ? 'text-muted-foreground text-xs'
                        : 'text-destructive text-xs'
                    }
                  >
                    {item.status === 'OK' ? 'ок' : 'ошибка'}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {formatRuDateTime(item.createdAt)} · {item.model} ·{' '}
                  {formatTokens(item.tokensIn)} → {formatTokens(item.tokensOut)}{' '}
                  ток. · {formatRub(item.costRub)} ·{' '}
                  {(item.latencyMs / 1000).toFixed(1)} с
                </p>
                {item.error ? (
                  <p className="text-destructive text-xs">{item.error}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
