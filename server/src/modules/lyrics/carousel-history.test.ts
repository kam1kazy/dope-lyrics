import { describe, expect, test } from 'bun:test';

import {
  buildCarouselPreviewText,
  pickIdsToEvict,
} from '~/modules/lyrics/carousel-history';

describe('buildCarouselPreviewText', () => {
  test('берёт непустые строки по порядку фраз', () => {
    expect(buildCarouselPreviewText(['a\n\nb', 'c'])).toBe('a\nb\nc');
  });

  test('обрезает на 12 строках', () => {
    const lines = Array.from({ length: 20 }, (_, index) => `L${index + 1}`);
    const preview = buildCarouselPreviewText([lines.join('\n')]);
    const previewLines = preview.split('\n');

    expect(previewLines).toHaveLength(12);
    expect(previewLines[0]).toBe('L1');
    expect(previewLines[11]).toBe('L12');
  });
});

describe('pickIdsToEvict', () => {
  const at = (day: number) => new Date(`2026-09-0${day}T00:00:00.000Z`);

  test('ниже лимита ничего не вытесняет', () => {
    expect(
      pickIdsToEvict(
        [
          { id: 1, createdAt: at(1), isLiked: false },
          { id: 2, createdAt: at(2), isLiked: false },
        ],
        12
      )
    ).toEqual([]);
  });

  test('сначала вытесняет самый старый без лайка', () => {
    const rows = Array.from({ length: 13 }, (_, index) => ({
      id: index + 1,
      createdAt: at((index % 9) + 1),
      isLiked: index === 0,
    }));
    rows[0] = { id: 1, createdAt: at(1), isLiked: true };
    rows[1] = { id: 2, createdAt: at(1), isLiked: false };

    expect(pickIdsToEvict(rows, 12)).toEqual([2]);
  });

  test('если все с лайком — вытесняет самый старый', () => {
    const rows = Array.from({ length: 13 }, (_, index) => ({
      id: index + 1,
      createdAt: new Date(Date.UTC(2026, 8, index + 1)),
      isLiked: true,
    }));

    expect(pickIdsToEvict(rows, 12)).toEqual([1]);
  });

  test('не вытесняет новый снимок, если старые все с лайком', () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      createdAt: new Date(Date.UTC(2026, 8, index + 1)),
      isLiked: true,
    }));
    rows.push({
      id: 13,
      createdAt: new Date(Date.UTC(2026, 8, 13)),
      isLiked: false,
    });

    expect(pickIdsToEvict(rows, 12)).toEqual([1]);
  });
});
