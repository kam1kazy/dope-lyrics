export const SHELF_FLAGS = [
  'favorites',
  'references',
  'censored',
  'hidden',
  'donors',
] as const;

export type ShelfFlag = (typeof SHELF_FLAGS)[number];

export type ShelfSelection = {
  included: ShelfFlag[];
  excluded: ShelfFlag[];
};

export const DEFAULT_EXCLUDED_SHELVES: ShelfFlag[] = ['hidden', 'donors'];

export const DEFAULT_SHELF_SELECTION: ShelfSelection = {
  included: [],
  excluded: DEFAULT_EXCLUDED_SHELVES,
};

export function isAllShelvesSelected(selection: ShelfSelection): boolean {
  return selection.included.length === 0;
}

export function isDefaultShelfSelection(selection: ShelfSelection): boolean {
  if (selection.included.length !== 0) {
    return false;
  }

  if (selection.excluded.length !== DEFAULT_EXCLUDED_SHELVES.length) {
    return false;
  }

  return DEFAULT_EXCLUDED_SHELVES.every((flag) =>
    selection.excluded.includes(flag)
  );
}

export function isShelfFlagOn(
  selection: ShelfSelection,
  flag: ShelfFlag
): boolean {
  return selection.included.includes(flag);
}

export function isShelfFlagExcluded(
  selection: ShelfSelection,
  flag: ShelfFlag
): boolean {
  return selection.excluded.includes(flag);
}

export function selectAllShelves(): ShelfSelection {
  return { included: [], excluded: [] };
}

export function clickShelfFlag(
  selection: ShelfSelection,
  flag: ShelfFlag
): ShelfSelection {
  if (selection.excluded.includes(flag)) {
    return {
      included: selection.included,
      excluded: selection.excluded.filter((item) => item !== flag),
    };
  }

  if (selection.included.includes(flag)) {
    return {
      included: selection.included.filter((item) => item !== flag),
      excluded: selection.excluded,
    };
  }

  return {
    included: [...selection.included, flag],
    excluded: selection.excluded,
  };
}

export function toggleExcludeShelfFlag(
  selection: ShelfSelection,
  flag: ShelfFlag
): ShelfSelection {
  if (selection.excluded.includes(flag)) {
    return {
      included: selection.included,
      excluded: selection.excluded.filter((item) => item !== flag),
    };
  }

  return {
    included: selection.included.filter((item) => item !== flag),
    excluded: [...selection.excluded, flag],
  };
}

export function lyricMatchesShelves(
  lyric: {
    isHidden: boolean;
    isFavorite: boolean;
    isReference: boolean;
    isCensored: boolean;
    isDonor: boolean;
  },
  selection: ShelfSelection
): boolean {
  const { included, excluded } = selection;
  const hideHidden =
    excluded.includes('hidden') && !included.includes('hidden');

  if (included.length > 0) {
    const matchesInclude =
      (included.includes('favorites') &&
        lyric.isFavorite &&
        (!hideHidden || !lyric.isHidden)) ||
      (included.includes('references') &&
        lyric.isReference &&
        (!hideHidden || !lyric.isHidden)) ||
      (included.includes('censored') &&
        lyric.isCensored &&
        (!hideHidden || !lyric.isHidden)) ||
      (included.includes('hidden') && lyric.isHidden) ||
      (included.includes('donors') && lyric.isDonor);

    if (!matchesInclude) {
      return false;
    }
  } else if (lyric.isHidden && excluded.includes('hidden')) {
    return false;
  }

  if (
    excluded.includes('censored') &&
    !included.includes('censored') &&
    lyric.isCensored
  ) {
    return false;
  }

  if (
    excluded.includes('favorites') &&
    !included.includes('favorites') &&
    lyric.isFavorite
  ) {
    return false;
  }

  if (
    excluded.includes('references') &&
    !included.includes('references') &&
    lyric.isReference
  ) {
    return false;
  }

  if (
    excluded.includes('donors') &&
    !included.includes('donors') &&
    lyric.isDonor
  ) {
    return false;
  }

  if (excluded.includes('hidden') && lyric.isHidden) {
    return false;
  }

  return true;
}
