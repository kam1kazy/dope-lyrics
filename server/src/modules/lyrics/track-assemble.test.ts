import { describe, expect, test } from 'bun:test';

import {
  type CollageSlotStored,
  remapCollageSlotsAfterSplit,
} from '~/modules/lyrics/track-assemble';

const LEGACY_END = 1_000_000;

const frame = (parts: CollageSlotStored['parts']): CollageSlotStored[] => [
  { songRole: 'INTRO', parts: [] },
  { songRole: 'VERSE', parts },
  { songRole: 'HOOK', parts: [] },
  { songRole: 'VERSE', parts: [] },
  { songRole: 'BRIDGE', parts: [] },
  { songRole: 'HOOK', parts: [] },
];

const verseParts = (slots: CollageSlotStored[]) => slots[1]?.parts ?? [];

describe('remapCollageSlotsAfterSplit', () => {
  test('кусок целиком вверху остаётся на старом id', () => {
    const slots = frame([{ lyricId: 10, startLine: 0, endLine: 4 }]);
    const next = remapCollageSlotsAfterSplit(slots, 10, 20, 8);

    expect(verseParts(next)).toEqual([
      { lyricId: 10, startLine: 0, endLine: 4 },
    ]);
  });

  test('кусок целиком внизу переезжает на новый id со сдвигом', () => {
    const slots = frame([{ lyricId: 10, startLine: 8, endLine: 12 }]);
    const next = remapCollageSlotsAfterSplit(slots, 10, 20, 8);

    expect(verseParts(next)).toEqual([
      { lyricId: 20, startLine: 0, endLine: 4 },
    ]);
  });

  test('кусок через разрез делится на две части', () => {
    const slots = frame([{ lyricId: 10, startLine: 2, endLine: 10 }]);
    const next = remapCollageSlotsAfterSplit(slots, 10, 20, 6);

    expect(verseParts(next)).toEqual([
      { lyricId: 10, startLine: 2, endLine: 6 },
      { lyricId: 20, startLine: 0, endLine: 4 },
    ]);
  });

  test('открытый конец (старый shape) покрывает обе половины', () => {
    const slots = frame([{ lyricId: 10, startLine: 0, endLine: LEGACY_END }]);
    const next = remapCollageSlotsAfterSplit(slots, 10, 20, 4);

    expect(verseParts(next)).toEqual([
      { lyricId: 10, startLine: 0, endLine: LEGACY_END },
      { lyricId: 20, startLine: 0, endLine: LEGACY_END },
    ]);
  });

  test('чужие id не трогает', () => {
    const slots = frame([
      { lyricId: 3, startLine: 0, endLine: 4 },
      { lyricId: 10, startLine: 4, endLine: 8 },
    ]);
    const next = remapCollageSlotsAfterSplit(slots, 10, 20, 4);

    expect(verseParts(next)).toEqual([
      { lyricId: 3, startLine: 0, endLine: 4 },
      { lyricId: 20, startLine: 0, endLine: 4 },
    ]);
  });
});
