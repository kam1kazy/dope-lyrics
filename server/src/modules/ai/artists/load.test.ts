import { describe, expect, test } from 'bun:test';

import { sample, TEST_SHELF } from '~/modules/ai/artists/fixtures';
import {
  applyReferenceFilter,
  loadArtistPool,
} from '~/modules/ai/artists/load';

const shelf = TEST_SHELF.map((artist) => ({
  ...artist,
  texts: [sample(artist.id * 10), sample(artist.id * 10 + 1)],
}));

describe('applyReferenceFilter', () => {
  test('без выбора — вся полка', () => {
    expect(applyReferenceFilter(shelf, null)).toHaveLength(shelf.length);
    expect(
      applyReferenceFilter(shelf, { artistIds: [], textIds: [] })
    ).toHaveLength(shelf.length);
  });

  test('выбран артист — только он и все его тексты', () => {
    const result = applyReferenceFilter(shelf, { artistIds: [2] });

    expect(result.map((artist) => artist.id)).toEqual([2]);
    expect(result[0]?.texts.map((item) => item.id)).toEqual([20, 21]);
  });

  test('выбран текст — его артист и только этот текст', () => {
    const result = applyReferenceFilter(shelf, { textIds: [11] });

    expect(result.map((artist) => artist.id)).toEqual([1]);
    expect(result[0]?.texts.map((item) => item.id)).toEqual([11]);
  });

  test('артист и текст другого артиста складываются', () => {
    const result = applyReferenceFilter(shelf, {
      artistIds: [3],
      textIds: [11],
    });

    expect(result.map((artist) => artist.id)).toEqual([1, 3]);
  });

  test('неизвестные id — пустой пул, а не вся полка', () => {
    expect(applyReferenceFilter(shelf, { artistIds: [999] })).toEqual([]);
  });
});

describe('loadArtistPool', () => {
  test('больше трёх артистов или текстов — ошибка', async () => {
    await expect(
      loadArtistPool(1, { artistIds: [1, 2, 3, 4] })
    ).rejects.toThrow('не больше 3 артистов');
    await expect(loadArtistPool(1, { textIds: [1, 2, 3, 4] })).rejects.toThrow(
      'не больше 3 артистов'
    );
  });
});
