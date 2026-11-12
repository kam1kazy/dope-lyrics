/** Фильтр эталонов генератора: жёсткий, пустой — вся полка. */
export type ReferenceFilter = {
  artistIds: number[];
  textIds: number[];
};

export const EMPTY_REFERENCE_FILTER: ReferenceFilter = {
  artistIds: [],
  textIds: [],
};

export const hasReferenceFilter = (filter: ReferenceFilter): boolean =>
  filter.artistIds.length > 0 || filter.textIds.length > 0;

/** Без артистов и текстов, которых больше нет на полке. */
export const keepLiveReferences = (
  filter: ReferenceFilter,
  live: { artistIds: ReadonlySet<number>; textIds: ReadonlySet<number> }
): ReferenceFilter => ({
  artistIds: filter.artistIds.filter((id) => live.artistIds.has(id)),
  textIds: filter.textIds.filter((id) => live.textIds.has(id)),
});
