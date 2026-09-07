'use client';

import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import {
  CATALOG_STATS,
  catalogStatsVariables,
  type ICatalogStats,
  type ICatalogThemeCount,
  LYRIC_DELIVERY_LABELS,
  LYRIC_ENERGY_LABELS,
  LYRIC_MOOD_LABELS,
  LYRIC_READINESS_LABELS,
  LYRIC_SONG_ROLE_LABELS,
  type LyricDelivery,
  type LyricEnergy,
  type LyricMood,
  type LyricReadiness,
} from '@/entities/lyric';
import type { CatalogSectionFilters } from '@/shared/lib/catalog-section-filters';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

import { CatalogActivityChart } from './catalog-activity-chart';

function formatShare(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function themeLabel(theme: ICatalogThemeCount): string {
  if (theme.kind === 'MOOD') {
    return LYRIC_MOOD_LABELS[theme.value as LyricMood] ?? theme.value;
  }

  return LYRIC_DELIVERY_LABELS[theme.value as LyricDelivery] ?? theme.value;
}

function readinessMessage(readyCount: number): string {
  if (readyCount <= 0) {
    return 'Пока ни один текст не доведён до состояния «готово». Продолжай работать.';
  }

  const mod10 = readyCount % 10;
  const mod100 = readyCount % 100;
  let noun: string;
  let verb: string;

  if (mod10 === 1 && mod100 !== 11) {
    noun = 'текст';
    verb = 'доведён';
  } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    noun = 'текста';
    verb = 'доведено';
  } else {
    noun = 'текстов';
    verb = 'доведено';
  }

  return `${formatCount(readyCount)} ${noun} ${verb} до состояния «готово». Продолжай работать.`;
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
  compact = false,
}: {
  label: string;
  count: number;
  share?: number;
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={
          compact
            ? 'text-lg font-medium tabular-nums'
            : 'text-2xl font-semibold tabular-nums tracking-tight'
        }
      >
        {formatCount(count)}
      </p>
      {share === undefined ? null : (
        <p className="text-muted-foreground text-xs tabular-nums">
          {formatShare(share)}
        </p>
      )}
    </div>
  );
}

const MATERIALS_BAR_COLOR = '#7075af';

function BarRow({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const width = max > 0 ? Math.max((count / max) * 100, count > 0 ? 2 : 0) : 0;

  return (
    <div className="flex items-center gap-3">
      <p className="w-24 shrink-0 truncate text-sm">{label}</p>
      <div className="bg-muted h-2 min-w-0 flex-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${width}%`, backgroundColor: MATERIALS_BAR_COLOR }}
        />
      </div>
      <p className="w-10 shrink-0 text-right text-sm tabular-nums">{count}</p>
    </div>
  );
}

export function CatalogStatsPanel({
  filters,
}: {
  filters: CatalogSectionFilters;
}) {
  const variables = catalogStatsVariables(filters);
  const { loading, error, data } = useQuery<{ catalogStats: ICatalogStats }>(
    CATALOG_STATS,
    { variables }
  );

  const stats = data?.catalogStats;

  const sortedRoles = useMemo(() => {
    if (!stats) {
      return [];
    }

    return [...stats.roles].sort((a, b) => b.phraseCount - a.phraseCount);
  }, [stats]);

  const topThemes = useMemo(() => {
    if (!stats) {
      return [];
    }

    return [...stats.themes]
      .filter((theme) => theme.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  const readinessMax = useMemo(() => {
    if (!stats) {
      return 0;
    }

    return Math.max(0, ...stats.readiness.map((item) => item.count));
  }, [stats]);

  const energyMax = useMemo(() => {
    if (!stats) {
      return 0;
    }

    return Math.max(0, ...stats.energy.map((item) => item.count));
  }, [stats]);

  const readyCount =
    stats?.readiness.find((item) => item.value === 'READY')?.count ?? 0;

  if (loading && !stats) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error) {
    return <ErrorText title="Ошибка" />;
  }

  if (!stats) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
        Пока ничего нет
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="col-span-2 rounded-lg border px-3 py-3 sm:col-span-2">
          <p className="text-muted-foreground text-xs">Фраз</p>
          <p className="text-3xl font-semibold tabular-nums tracking-tight">
            {formatCount(stats.phraseCount)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            +{formatCount(stats.addedLastMonth)} за последний месяц
          </p>
        </div>
        <StatCard
          label="С ролью"
          count={stats.withRole.count}
          share={stats.withRole.share}
          compact
        />
        <StatCard
          label="Эталоны"
          count={stats.references.count}
          share={stats.references.share}
          compact
        />
        <StatCard
          label="Избранное"
          count={stats.favorites.count}
          share={stats.favorites.share}
          compact
        />
        <StatCard
          label="Скрыто"
          count={stats.hidden.count}
          share={stats.hidden.share}
          compact
        />
        <StatCard
          label="Цензура"
          count={stats.censored.count}
          share={stats.censored.share}
          compact
        />
        <StatCard
          label="Доноры"
          count={stats.donors.count}
          share={stats.donors.share}
          compact
        />
      </div>

      <CatalogActivityChart filters={filters} />

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border px-3 py-3">
          <h3 className="mb-3 text-sm font-medium">Формы (роли)</h3>
          <ul className="flex flex-col gap-2">
            {sortedRoles.map((role) => (
              <li
                key={role.songRole}
                className="flex items-baseline justify-between gap-2"
              >
                <p className="text-sm">
                  {LYRIC_SONG_ROLE_LABELS[role.songRole]}
                </p>
                <p className="text-muted-foreground text-sm tabular-nums">
                  {role.phraseCount}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border px-3 py-3">
          <h3 className="mb-3 text-sm font-medium">Топ тем и тегов</h3>
          {topThemes.length === 0 ? (
            <p className="text-muted-foreground text-xs">Пусто</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {topThemes.map((theme) => (
                <li
                  key={`${theme.kind}:${theme.value}`}
                  className="flex items-baseline justify-between gap-2"
                >
                  <p className="text-sm">{themeLabel(theme)}</p>
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {theme.count}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border px-3 py-3">
        <h3 className="mb-3 text-sm font-medium">Энергия</h3>
        <ul className="flex flex-col gap-2.5">
          {stats.energy.map((item) => (
            <li key={item.value}>
              <BarRow
                label={
                  LYRIC_ENERGY_LABELS[item.value as LyricEnergy] ?? item.value
                }
                count={item.count}
                max={energyMax}
              />
            </li>
          ))}
        </ul>
        {stats.energyNone > 0 ? (
          <p className="text-muted-foreground mt-3 text-xs">
            без значения · {formatCount(stats.energyNone)}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border px-3 py-3">
        <h3 className="mb-3 text-sm font-medium">Состояние материалов</h3>
        <ul className="flex flex-col gap-2.5">
          {stats.readiness.map((item) => (
            <li key={item.value}>
              <BarRow
                label={
                  LYRIC_READINESS_LABELS[item.value as LyricReadiness] ??
                  item.value
                }
                count={item.count}
                max={readinessMax}
              />
            </li>
          ))}
        </ul>
        {stats.readinessNone > 0 ? (
          <p className="text-muted-foreground mt-3 text-xs">
            без значения · {formatCount(stats.readinessNone)}
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border px-3 py-3">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-medium">Без роли</h3>
            <p className="text-muted-foreground text-xs tabular-nums">
              {formatCount(stats.unscoped.phraseCount)}
            </p>
          </div>
          <CountsLine items={stats.unscoped.mood} labels={LYRIC_MOOD_LABELS} />
          <div className="mt-1">
            <CountsLine
              items={stats.unscoped.delivery}
              labels={LYRIC_DELIVERY_LABELS}
            />
          </div>
        </section>

        <section className="rounded-lg border px-3 py-3">
          <h3 className="mb-2 text-sm font-medium">Готовность</h3>
          <p className="text-sm leading-relaxed">
            {readinessMessage(readyCount)}
          </p>
        </section>
      </div>
    </div>
  );
}
