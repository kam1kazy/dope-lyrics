'use client';

import { useQuery } from '@apollo/client/react';
import { FilePlus, Layers, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

import { AI_STATUS } from '@/features/catalog-assemble';
import { Hint } from '@/shared/ui/hint';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import type { IScratchCloseLine, IScratchResult } from '../api/queries';
import type { ScratchSession } from '../lib/use-scratch-session';

const sourceLabel = (item: IScratchResult['sources'][number]) =>
  item.title ? `${item.artistName} «${item.title}»` : item.artistName;

const isLyricLine = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed.length > 0 && !/^\[[^\]]*\]$/.test(trimmed);
};

/** Ответ построчно; строки, близкие к строкам кумиров, подсвечены с источником. */
function AnswerText({
  text,
  close,
}: {
  text: string;
  close: readonly IScratchCloseLine[];
}) {
  const byLine = new Map(close.map((item) => [item.line, item]));
  let lyricIndex = -1;

  return (
    <div className="text-sm whitespace-pre-wrap">
      {text.split('\n').map((line, index) => {
        if (!isLyricLine(line)) {
          return <div key={index}>{line || ' '}</div>;
        }

        lyricIndex += 1;
        const match = byLine.get(lyricIndex);
        if (!match) {
          return <div key={index}>{line}</div>;
        }

        return (
          <div key={index}>
            <Hint
              label={`Близко к строке ${match.artistName}: ${match.sourceLine}`}
            >
              <span className="rounded-sm bg-orange-400/25">{line}</span>
            </Hint>
          </div>
        );
      })}
    </div>
  );
}

/** Третий уровень меню: готовый текст «С нуля» справа от формы. */
export function ScratchResultPane({ session }: { session: ScratchSession }) {
  const { data: status } = useQuery<{ aiStatus: { enabled: boolean } }>(
    AI_STATUS
  );
  const [collageOpen, setCollageOpen] = useState(false);
  const enabled = status?.aiStatus.enabled === true;
  const { answer, writing, saving, closePane } = session;
  const busy = writing || saving;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-1">
        <p className="text-muted-foreground min-w-0 flex-1 text-xs">
          {!answer
            ? 'Пишу…'
            : `Склейка из: ${answer.sources.map(sourceLabel).join(', ')}`}
        </p>
        <Hint label={collageOpen ? 'Скрыть склейку' : 'Показать склейку'}>
          <Button
            type="button"
            size="icon"
            variant={collageOpen ? 'secondary' : 'ghost'}
            className="size-8"
            aria-label="Склейка"
            aria-pressed={collageOpen}
            disabled={!answer}
            onClick={() => {
              setCollageOpen((open) => !open);
            }}
          >
            <Layers className="size-4" />
          </Button>
        </Hint>
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
        <>
          {answer.close.length > 0 ? (
            <p className="text-muted-foreground text-xs">
              Подсвечено близких к кумирам строк: {answer.close.length}
            </p>
          ) : null}
          <AnswerText text={answer.aiText} close={answer.close} />
          {collageOpen ? (
            <div className="border-border flex flex-col gap-1 border-t pt-3">
              <p className="text-muted-foreground text-xs">Склейка</p>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {answer.collage}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex justify-center py-6">
          <Spinner className="size-5" />
        </div>
      )}
    </div>
  );
}
