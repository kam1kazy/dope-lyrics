'use client';

import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { CATALOG_ACTIVITY, type ICatalogActivityPoint } from '@/entities/lyric';
import { cn } from '@/shared/lib/utils/cn';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/ui/shadcn/ui/chart';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';

const ACTIVITY_DAYS = [7, 30, 90] as const;

type ActivityDays = (typeof ACTIVITY_DAYS)[number];

const MONTH_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
] as const;

const ACTIVITY_COLOR = '#7075af';

const chartConfig = {
  count: {
    label: 'Фразы',
    color: ACTIVITY_COLOR,
  },
} satisfies ChartConfig;

function formatDayLabel(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  const monthIndex = Number(month) - 1;
  const monthLabel = MONTH_SHORT[monthIndex] ?? month;
  return `${day} ${monthLabel}`;
}

function daysLabel(days: ActivityDays): string {
  return `${days} дней`;
}

export function CatalogActivityChart() {
  const [days, setDays] = useState<ActivityDays>(30);
  const { loading, error, data } = useQuery<{
    catalogActivity: ICatalogActivityPoint[];
  }>(CATALOG_ACTIVITY, {
    variables: { days },
  });

  const points = useMemo(() => {
    const rows = data?.catalogActivity ?? [];
    return rows.map((row) => ({
      date: row.date,
      label: formatDayLabel(row.date),
      count: row.count,
    }));
  }, [data?.catalogActivity]);

  const tickInterval = days === 7 ? 0 : days === 30 ? 4 : 14;

  return (
    <section className="rounded-lg border px-3 py-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Активность фраз</h3>
        <div className="flex gap-1">
          {ACTIVITY_DAYS.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={days === option ? 'secondary' : 'ghost'}
              className={cn(
                'h-7 px-2 text-xs',
                days === option && 'font-medium'
              )}
              aria-pressed={days === option}
              onClick={() => {
                setDays(option);
              }}
            >
              {daysLabel(option)}
            </Button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex h-[180px] items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : error ? (
        <p className="text-muted-foreground flex h-[180px] items-center justify-center text-sm">
          Не удалось загрузить график
        </p>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[180px] w-full"
        >
          <AreaChart
            data={points}
            margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillActivity" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.45}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              interval={tickInterval}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={28}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const first = payload?.[0]?.payload as
                      { label?: string } | undefined;
                    return first?.label ?? '';
                  }}
                />
              }
            />
            <Area
              dataKey="count"
              type="monotone"
              fill="url(#fillActivity)"
              stroke="var(--color-count)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </section>
  );
}
