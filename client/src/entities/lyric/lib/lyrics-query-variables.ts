export type LyricsQueryVariables = {
  tags: string[] | null;
  keyword: string | null;
  emojis: string[] | null;
  dateFrom: string | null;
  dateTo: string | null;
  referencesOnly: boolean;
  favoritesOnly: boolean;
  hiddenOnly: boolean;
};
