'use client';

import { useQuery } from '@apollo/client/react';
import { useState } from 'react';

import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import {
  AI_SETTINGS,
  type IAiPromptVersion,
  type IAiUsageItem,
  type IAiUsageSummary,
} from '../api/queries';
import { type AiTabKey, AiTabs } from './ai-tabs';
import { PromptTab } from './prompt-tab';
import { UsageTab } from './usage-tab';
import { VersionList } from './version-list';

type SettingsData = {
  aiStatus: { enabled: boolean };
  aiPrompt: IAiPromptVersion | null;
  aiPromptVersions: IAiPromptVersion[];
  aiUsageSummary: IAiUsageSummary;
  aiUsageRecent: IAiUsageItem[];
};

export function AiSettingsPanel() {
  const { data, loading, error } = useQuery<SettingsData>(AI_SETTINGS, {
    fetchPolicy: 'cache-and-network',
  });
  const [tab, setTab] = useState<AiTabKey>('prompt');

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

  return (
    <div className="flex flex-col gap-4 p-4">
      {!data.aiStatus.enabled ? (
        <p className="border-border text-muted-foreground rounded-md border p-3 text-sm">
          ИИ не настроен: на сервере не задан ключ провайдера.
        </p>
      ) : null}

      <AiTabs value={tab} onChange={setTab} />

      {tab === 'prompt' ? (
        <PromptTab
          current={data.aiPrompt}
          versions={data.aiPromptVersions}
          aiEnabled={data.aiStatus.enabled}
        />
      ) : null}
      {tab === 'versions' ? (
        <VersionList
          versions={data.aiPromptVersions}
          currentId={data.aiPrompt?.id}
        />
      ) : null}
      {tab === 'usage' ? (
        <UsageTab summary={data.aiUsageSummary} recent={data.aiUsageRecent} />
      ) : null}
    </div>
  );
}
