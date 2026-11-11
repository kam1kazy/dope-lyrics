'use client';

import { formatRuDateTime } from '@/shared/lib/format-datetime';

import type {
  IAiUsageItem,
  IAiUsagePeriod,
  IAiUsageSummary,
} from '../api/queries';
import { formatRub, formatTokens } from '../lib/format';

const PERIODS: { key: keyof IAiUsageSummary; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'month', label: '30 дней' },
  { key: 'all', label: 'Всё время' },
];

const KIND_LABELS: Record<string, string> = {
  COLLAGE_REWRITE: 'Правка склейки',
  PROMPT_META: 'Название промпта',
  REFERENCE_SELECT: 'Подбор эталона',
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

export function UsageTab({
  summary,
  recent,
}: {
  summary: IAiUsageSummary;
  recent: IAiUsageItem[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Расход (оценка)</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {PERIODS.map(({ key, label }) => (
            <UsagePeriod key={key} label={label} period={summary[key]} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Последние запросы</h3>
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">Запросов ещё не было</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((item) => (
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
