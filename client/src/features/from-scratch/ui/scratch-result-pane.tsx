'use client';

import { useQuery } from '@apollo/client/react';
import { FilePlus, RefreshCw, X } from 'lucide-react';

import { AI_STATUS } from '@/features/catalog-assemble';
import { Hint } from '@/shared/ui/hint';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import type { IScratchResult } from '../api/queries';
import type { ScratchSession } from '../lib/use-scratch-session';

const referenceLabel = (item: IScratchResult['references'][number]) =>
  item.title ? `${item.artistName} «${item.title}»` : item.artistName;

/** Третий уровень меню: готовый текст «С нуля» справа от формы. */
export function ScratchResultPane({ session }: { session: ScratchSession }) {
  const { data: status } = useQuery<{ aiStatus: { enabled: boolean } }>(
    AI_STATUS
  );
  const enabled = status?.aiStatus.enabled === true;
  const { answer, writing, saving, closePane } = session;
  const busy = writing || saving;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-1">
        <p className="text-muted-foreground min-w-0 flex-1 text-xs">
          {!answer
            ? 'Пишу…'
            : answer.references.length > 0
              ? `Эталоны: ${answer.references.map(referenceLabel).join(', ')}`
              : 'Без эталонов'}
        </p>
        <Hint label="Ещё раз">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Ещё раз"
            disabled={!answer || !enabled || busy}
            onClick={() => {
              if (answer) {
                void session.write(answer.request);
              }
            }}
          >
            {writing ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshCw className="size-4" />
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
            disabled={!answer || busy}
            onClick={() => {
              void session.save();
            }}
          >
            {saving ? (
              <Spinner className="size-4" />
            ) : (
              <FilePlus className="size-4" />
            )}
          </Button>
        </Hint>
        <Hint label="Закрыть">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Закрыть"
            onClick={closePane}
          >
            <X className="size-4" />
          </Button>
        </Hint>
      </div>
      {answer ? (
        <p className="text-sm whitespace-pre-wrap">{answer.aiText}</p>
      ) : (
        <div className="flex justify-center py-6">
          <Spinner className="size-5" />
        </div>
      )}
    </div>
  );
}
