'use client';

import { useState } from 'react';

import { formatRuDateTime } from '@/shared/lib/format-datetime';
import { Button } from '@/shared/ui/shadcn/ui/button';

import type { IAiPromptVersion } from '../api/queries';
import { versionTitle } from '../lib/format';

export function VersionList({
  versions,
  currentId,
}: {
  versions: IAiPromptVersion[];
  currentId: number | undefined;
}) {
  const [viewedId, setViewedId] = useState<number | null>(null);
  const viewed = versions.find((version) => version.id === viewedId) ?? null;

  if (versions.length === 0) {
    return <p className="text-muted-foreground text-sm">Версий ещё нет</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {versions.map((version) => (
        <Button
          key={version.id}
          type="button"
          variant={viewedId === version.id ? 'secondary' : 'ghost'}
          size="sm"
          className="h-auto justify-start py-1.5 text-left"
          onClick={() => {
            setViewedId(viewedId === version.id ? null : version.id);
          }}
        >
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            <span className="max-w-full truncate">
              №{version.number} · {versionTitle(version)}
              {version.id === currentId ? ' · текущая' : ''}
            </span>
            <span className="text-muted-foreground max-w-full truncate text-xs font-normal">
              {formatRuDateTime(version.createdAt)}
              {version.description ? ` · ${version.description}` : ''}
            </span>
          </span>
        </Button>
      ))}
      {viewed ? (
        <pre className="border-border mt-1 rounded-md border p-3 text-sm whitespace-pre-wrap">
          {viewed.text || '(пусто)'}
        </pre>
      ) : null}
    </div>
  );
}
