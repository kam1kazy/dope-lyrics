import { describe, expect, test } from 'bun:test';

import {
  buildScratchSystem,
  SCRATCH_ANCHOR_REPLACEMENTS,
  SCRATCH_SHELF_FRAME,
} from '~/modules/ai/scratch/frame';

describe('рамки «С нуля»', () => {
  test('каждая замена «Якорей» находит свой пункт в «Приёмах»', () => {
    const lines = SCRATCH_SHELF_FRAME.split('\n');

    for (const [from] of SCRATCH_ANCHOR_REPLACEMENTS) {
      expect(lines).toContain(from);
    }
  });

  test('«Приёмы» — полка, дословно ни одной строки', () => {
    const system = buildScratchSystem('SHELF');

    expect(system).toContain('Это не черновик трека, а полка');
    expect(system).toContain('Дословно из склейки не оставляй ни одной');
    expect(system).not.toContain('якорь');
  });

  test('«Якоря» — строка-якорь, хук из куплета, без квоты абсурда', () => {
    const system = buildScratchSystem('ANCHORS');

    expect(system).toContain('Как работать со склейкой — якоря:');
    expect(system).toContain('Выбери до шести якорей');
    expect(system).toContain(
      'Хук развивай из самого сильного куплетного удара'
    );
    expect(system).toContain('оставь строку без рифмы');
    expect(system).not.toContain('Дословно из склейки не оставляй ни одной');
    expect(system).not.toContain('В каждом куплете одна абсурдная строка');
    expect(system).not.toContain('Пельмени');
  });

  test('общие правила одинаковы в обоих режимах', () => {
    const rule = '- Связь — звонок, сообщения, сеть, экран — не приноси.';

    expect(buildScratchSystem('SHELF')).toContain(rule);
    expect(buildScratchSystem('ANCHORS')).toContain(rule);
  });
});
