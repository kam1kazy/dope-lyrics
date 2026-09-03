import { describe, expect, test } from 'bun:test';

import {
  buildGluedText,
  cleanedIndexShiftMap,
  collectTakenRangesByLyric,
  remapCollageSlotsAfterRip,
  ripCleanedRangesFromText,
  unionLineRanges,
} from '~/modules/lyrics/lyric-glue';
import type { CollageSlotStored } from '~/modules/lyrics/track-assemble';

const emptyFrame = (): CollageSlotStored[] => [
  { songRole: 'INTRO', parts: [] },
  { songRole: 'VERSE', parts: [] },
  { songRole: 'HOOK', parts: [] },
  { songRole: 'VERSE', parts: [] },
  { songRole: 'BRIDGE', parts: [] },
  { songRole: 'HOOK', parts: [] },
];

describe('unionLineRanges', () => {
  test('сливает пересечения', () => {
    expect(
      unionLineRanges([
        { startLine: 0, endLine: 2 },
        { startLine: 1, endLine: 4 },
        { startLine: 6, endLine: 8 },
      ])
    ).toEqual([
      { startLine: 0, endLine: 4 },
      { startLine: 6, endLine: 8 },
    ]);
  });
});

describe('ripCleanedRangesFromText', () => {
  test('вырезает середину, остаток на месте', () => {
    const text = 'a\nb\nc\nd';
    const result = ripCleanedRangesFromText(text, [
      { startLine: 1, endLine: 3 },
    ]);

    expect(result.removed).toBe(true);
    expect(result.emptied).toBe(false);
    expect(result.nextText).toBe('a\nd');
  });

  test('если забрали всё — текст не трогаем', () => {
    const text = 'a\nb';
    const result = ripCleanedRangesFromText(text, [
      { startLine: 0, endLine: 2 },
    ]);

    expect(result.emptied).toBe(true);
    expect(result.removed).toBe(false);
    expect(result.nextText).toBe(text);
  });

  test('хештег не считается очищенной строкой', () => {
    const text = 'a\n#tag\nb\nc';
    const result = ripCleanedRangesFromText(text, [
      { startLine: 1, endLine: 2 },
    ]);

    expect(result.nextText).toBe('a\n#tag\nc');
  });
});

describe('buildGluedText', () => {
  test('склеивает слоты и пропускает второй хук', () => {
    const slots = emptyFrame();
    slots[1] = {
      songRole: 'VERSE',
      parts: [{ lyricId: 1, startLine: 0, endLine: 2 }],
    };
    slots[2] = {
      songRole: 'HOOK',
      parts: [{ lyricId: 2, startLine: 0, endLine: 1 }],
    };
    slots[5] = {
      songRole: 'HOOK',
      parts: [{ lyricId: 2, startLine: 0, endLine: 1 }],
    };

    const texts = new Map([
      [1, 'one\ntwo\nthree'],
      [2, 'hook'],
    ]);

    const built = buildGluedText(slots, texts);
    expect(built.text).toBe('one\ntwo\n\nhook');
    expect(built.cleanedLineCount).toBe(3);
    expect(built.placements).toHaveLength(2);
  });
});

describe('remapCollageSlotsAfterRip', () => {
  test('остаток сдвигается, взятое уезжает на glued', () => {
    const slots = emptyFrame();
    slots[1] = {
      songRole: 'VERSE',
      parts: [{ lyricId: 10, startLine: 0, endLine: 4 }],
    };

    const placements = [
      {
        lyricId: 10,
        startLine: 2,
        endLine: 4,
        gluedStart: 0,
        gluedEnd: 2,
      },
    ];
    const shiftMap = cleanedIndexShiftMap(4, [{ startLine: 2, endLine: 4 }]);

    const next = remapCollageSlotsAfterRip(
      slots,
      10,
      99,
      shiftMap,
      placements,
      true
    );

    expect(next[1]?.parts).toEqual([
      { lyricId: 10, startLine: 0, endLine: 2 },
      { lyricId: 99, startLine: 0, endLine: 2 },
    ]);
  });
});

describe('collectTakenRangesByLyric', () => {
  test('группирует по id', () => {
    const map = collectTakenRangesByLyric([
      {
        lyricId: 1,
        startLine: 0,
        endLine: 2,
        gluedStart: 0,
        gluedEnd: 2,
      },
      {
        lyricId: 1,
        startLine: 4,
        endLine: 5,
        gluedStart: 2,
        gluedEnd: 3,
      },
    ]);

    expect(map.get(1)).toEqual([
      { startLine: 0, endLine: 2 },
      { startLine: 4, endLine: 5 },
    ]);
  });
});
