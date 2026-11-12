import { describe, expect, test } from 'bun:test';

import { keepLiveReferences } from '@/shared/lib/reference-filter';

describe('keepLiveReferences', () => {
  test('убирает пропавшие с полки и режет до трёх', () => {
    const live = {
      artistIds: new Set([1, 2, 3, 4, 5]),
      textIds: new Set([10, 11]),
    };

    expect(
      keepLiveReferences(
        { artistIds: [9, 1, 2, 3, 4], textIds: [10, 12, 11] },
        live
      )
    ).toEqual({ artistIds: [1, 2, 3], textIds: [10, 11] });
  });
});
