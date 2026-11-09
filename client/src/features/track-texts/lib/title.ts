const SECTION_TAG = /^\[.*\]$/;

/** Тема трека, а если её нет — первая строка текста без пометок вроде «[Куплет]». */
export const trackTextTitle = (row: {
  theme: string | null;
  text: string;
}): string => {
  if (row.theme) {
    return row.theme;
  }

  const line = row.text
    .split('\n')
    .map((item) => item.trim())
    .find((item) => item !== '' && !SECTION_TAG.test(item));

  return line ?? 'Без темы';
};
