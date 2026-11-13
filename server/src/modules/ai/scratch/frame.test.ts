import { describe, expect, test } from 'bun:test';

import { COLLAGE_REWRITE_FRAME } from '~/modules/ai/rewrite/frame';
import {
  buildScratchSystem,
  SCRATCH_FRAME_REPLACEMENTS,
} from '~/modules/ai/scratch/frame';

describe('рамка «С нуля»', () => {
  test('каждая замена находит свой пункт в рамке правки', () => {
    const lines = COLLAGE_REWRITE_FRAME.split('\n');

    for (const [from] of SCRATCH_FRAME_REPLACEMENTS) {
      expect(lines).toContain(from);
    }
  });

  test('дословно — ни одной строки, карточек нет, остальное как в правке', () => {
    const system = buildScratchSystem();

    expect(system).toContain('Дословно из склейки не оставляй ни одной');
    expect(system).toContain('Их мир, словарь и находки бери');
    expect(system).not.toContain('не больше трети строк');
    expect(system).not.toContain('карточки приёмов');
    expect(system).not.toContain('Строку, которую оставляешь дословно');
    expect(system).toContain('Хук склейки — тоже черновик');
  });
});
