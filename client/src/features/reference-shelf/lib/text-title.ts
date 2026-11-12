/** Название текста или его первая строка. */
export const referenceTextTitle = (item: {
  title: string | null;
  text: string;
}): string =>
  item.title?.trim() ||
  item.text
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean) ||
  'Без названия';
