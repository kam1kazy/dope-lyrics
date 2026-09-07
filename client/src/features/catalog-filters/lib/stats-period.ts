export type StatsPeriodPreset = 'year' | 'quarter' | 'month';

export const STATS_PERIOD_PRESETS: {
  id: StatsPeriodPreset;
  label: string;
}[] = [
  { id: 'year', label: 'Год' },
  { id: 'quarter', label: 'Квартал' },
  { id: 'month', label: 'Месяц' },
];

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function statsPeriodRange(
  preset: StatsPeriodPreset,
  now = new Date()
): { dateFrom: string; dateTo: string } {
  const dateTo = formatIsoDate(now);

  if (preset === 'month') {
    return {
      dateFrom: formatIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      dateTo,
    };
  }

  if (preset === 'quarter') {
    const startMonth = Math.floor(now.getMonth() / 3) * 3;
    return {
      dateFrom: formatIsoDate(new Date(now.getFullYear(), startMonth, 1)),
      dateTo,
    };
  }

  return {
    dateFrom: formatIsoDate(new Date(now.getFullYear(), 0, 1)),
    dateTo,
  };
}

export function matchingStatsPeriodPreset(
  dateFrom: string,
  dateTo: string,
  now = new Date()
): StatsPeriodPreset | null {
  const from = dateFrom.trim();
  const to = dateTo.trim();

  if (!from || !to) {
    return null;
  }

  for (const { id } of STATS_PERIOD_PRESETS) {
    const range = statsPeriodRange(id, now);

    if (range.dateFrom === from && range.dateTo === to) {
      return id;
    }
  }

  return null;
}
