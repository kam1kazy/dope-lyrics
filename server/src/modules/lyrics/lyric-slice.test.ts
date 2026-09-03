import { describe, expect, test } from 'bun:test';

import { buildSliceFromRanges } from '~/modules/lyrics/lyric-text';

describe('buildSliceFromRanges', () => {
  test('вырезает середину одним диапазоном', () => {
    const text = 'a\nb\nc\nd\ne';
    const built = buildSliceFromRanges(
      text,
      [{ afterLine: 0, untilLine: 2 }],
      10
    );

    expect(built.createdText).toBe('b\nc');
    expect(built.cleanedTaken).toEqual([{ startLine: 1, endLine: 3 }]);
    expect(built.placements).toEqual([
      {
        lyricId: 10,
        startLine: 1,
        endLine: 3,
        gluedStart: 0,
        gluedEnd: 2,
      },
    ]);
  });

  test('несколько кусков склеивает пустой строкой', () => {
    const text = 'a\nb\nc\nd\ne';
    const built = buildSliceFromRanges(
      text,
      [
        { afterLine: 0, untilLine: 1 },
        { afterLine: 3, untilLine: 4 },
      ],
      7
    );

    expect(built.createdText).toBe('b\n\ne');
    expect(built.cleanedTaken).toEqual([
      { startLine: 1, endLine: 2 },
      { startLine: 4, endLine: 5 },
    ]);
  });

  test('пересечение диапазонов — ошибка', () => {
    expect(() =>
      buildSliceFromRanges(
        'a\nb\nc\nd',
        [
          { afterLine: 0, untilLine: 2 },
          { afterLine: 1, untilLine: 3 },
        ],
        1
      )
    ).toThrow('пересекаются');
  });

  test('диапазон с первой до последней строки', () => {
    const text = 'a\nb\nc';
    const built = buildSliceFromRanges(
      text,
      [{ afterLine: -1, untilLine: 2 }],
      1
    );

    expect(built.createdText).toBe('a\nb\nc');
    expect(built.cleanedTaken).toEqual([{ startLine: 0, endLine: 3 }]);
  });

  test('первая строка — afterLine перед началом', () => {
    const built = buildSliceFromRanges(
      'a\nb\nc',
      [{ afterLine: -1, untilLine: 0 }],
      1
    );

    expect(built.createdText).toBe('a');
  });

  test('пустой фрагмент — ошибка', () => {
    expect(() =>
      buildSliceFromRanges('a\n\n\nb', [{ afterLine: 0, untilLine: 2 }], 1)
    ).toThrow('должен содержать текст');
  });
});
