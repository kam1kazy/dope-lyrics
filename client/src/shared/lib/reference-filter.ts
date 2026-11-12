/** Фильтр эталонов генератора: жёсткий, пустой — вся полка. */
export type ReferenceFilter = {
  artistIds: number[];
  textIds: number[];
};

/** Не больше трёх артистов и трёх текстов в фильтре. */
export const REFERENCE_FILTER_LIMIT = 3;

export const EMPTY_REFERENCE_FILTER: ReferenceFilter = {
  artistIds: [],
  textIds: [],
};

export const hasReferenceFilter = (filter: ReferenceFilter): boolean =>
  filter.artistIds.length > 0 || filter.textIds.length > 0;

/** Без артистов и текстов, которых больше нет на полке, и не больше лимита. */
export const keepLiveReferences = (
  filter: ReferenceFilter,
  live: { artistIds: ReadonlySet<number>; textIds: ReadonlySet<number> }
): ReferenceFilter => ({
  artistIds: filter.artistIds
    .filter((id) => live.artistIds.has(id))
    .slice(0, REFERENCE_FILTER_LIMIT),
  textIds: filter.textIds
    .filter((id) => live.textIds.has(id))
    .slice(0, REFERENCE_FILTER_LIMIT),
});
