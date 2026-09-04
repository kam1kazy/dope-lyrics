const pad2 = (value: number): string => String(value).padStart(2, '0');

export const formatRuDateTimeParts = (
  iso: string
): { time: string; date: string } => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { time: iso, date: '' };
  }

  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const now = new Date();
  const dateLabel =
    date.getFullYear() < now.getFullYear()
      ? `${day}.${month}.${String(date.getFullYear()).slice(-2)}`
      : `${day}.${month}`;

  return { time, date: dateLabel };
};

export const formatRuDateTime = (iso: string): string => {
  const { time, date } = formatRuDateTimeParts(iso);
  if (date === '') {
    return iso;
  }

  return `${date} | ${time}`;
};
