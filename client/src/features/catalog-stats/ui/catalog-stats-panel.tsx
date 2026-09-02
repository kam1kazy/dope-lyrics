'use client';

import { useQuery } from '@apollo/client/react';

import {
  CATALOG_STATS,
  type ICatalogStats,
  LYRIC_DELIVERY_LABELS,
  LYRIC_MOOD_LABELS,
  LYRIC_READINESS_LABELS,
  LYRIC_SONG_ROLE_LABELS,
} from '@/entities/lyric';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

function formatShare(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function CountsLine({
  items,
  labels,
}: {
  items: { value: string; count: number }[];
  labels: Record<string, string>;
}) {
  const visible = items.filter((item) => item.count > 0);

  if (visible.length === 0) {
    return <p className="text-muted-foreground text-xs">Пусто</p>;
  }

  return (
    <p className="text-sm leading-relaxed">
      {visible
        .map((item) => `${labels[item.value] ?? item.value} · ${item.count}`)
        .join(' · ')}
    </p>
  );
}

function StatCard({
  label,
  count,
  share,
}: {
  label: string;
  count: number;
  share?: number;
}) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-medium tabular-nums">{count}</p>
      {share === undefined ? null : (
        <p className="text-muted-foreground text-xs tabular-nums">
          {formatShare(share)}
        </p>
      )}
    </div>
  );
}

export function CatalogStatsPanel() {
  const { loading, error, data } = useQuery<{ catalogStats: ICatalogStats }>(
    CATALOG_STATS
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error) {
    return <ErrorText title="Ошибка" />;
  }

  const stats = data?.catalogStats;

  if (!stats) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
        Пока ничего нет
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <p className="text-muted-foreground text-xs leading-relaxed">
        Считаются куски песни: фраза с куплетом и хуком входит в оба ряда. Это
        не уникальные тексты.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCard label="Фраз" count={stats.phraseCount} />
        <StatCard
          label="С ролью"
          count={stats.withRole.count}
          share={stats.withRole.share}
        />
        <StatCard
          label="Эталоны"
          count={stats.references.count}
          share={stats.references.share}
        />
        <StatCard
          label="Избранное"
          count={stats.favorites.count}
          share={stats.favorites.share}
        />
        <StatCard
          label="Скрыто"
          count={stats.hidden.count}
          share={stats.hidden.share}
        />
        <StatCard
          label="Цензура"
          count={stats.censored.count}
          share={stats.censored.share}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Роли</h3>
        <ul className="flex flex-col gap-3">
          {stats.roles.map((role) => (
            <li key={role.songRole} className="rounded-lg border px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">
                  {LYRIC_SONG_ROLE_LABELS[role.songRole]}
                </p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {role.phraseCount}
                </p>
              </div>
              {role.phraseCount > 0 ? (
                <div className="mt-2 flex flex-col gap-1">
                  <CountsLine items={role.mood} labels={LYRIC_MOOD_LABELS} />
                  <CountsLine
                    items={role.delivery}
                    labels={LYRIC_DELIVERY_LABELS}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium">Без роли</h3>
          <p className="text-muted-foreground text-xs tabular-nums">
            {stats.unscoped.phraseCount}
          </p>
        </div>
        <CountsLine items={stats.unscoped.mood} labels={LYRIC_MOOD_LABELS} />
        <CountsLine
          items={stats.unscoped.delivery}
          labels={LYRIC_DELIVERY_LABELS}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Готовность</h3>
        <CountsLine items={stats.readiness} labels={LYRIC_READINESS_LABELS} />
        {stats.readinessNone > 0 ? (
          <p className="text-muted-foreground text-xs">
            без значения · {stats.readinessNone}
          </p>
        ) : null}
      </section>
    </div>
  );
}
