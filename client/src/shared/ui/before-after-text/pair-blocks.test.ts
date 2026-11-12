import { describe, expect, test } from 'bun:test';

import { pairRewriteBlocks } from './pair-blocks';

const before = `[Куплет]
Я отдам тебе все
Последние деньги

Когда наберешься сил
Я каждый день на нервах

[Хук]
Жаааль
Что мой, мир сейчас замерз`;

const after = `[Куплет]
Я отдам тебе последние деньги

[Хук]
Жаааль
Я люблю тебя, но не знаю, как быть`;

describe('pairRewriteBlocks', () => {
  test('лишний абзац куплета не склеивает хук со всем текстом', () => {
    const blocks = pairRewriteBlocks(before, after);

    expect(blocks).toEqual([
      {
        before: '[Куплет]\nЯ отдам тебе все\nПоследние деньги',
        after: '[Куплет]\nЯ отдам тебе последние деньги',
        afterLine: 0,
      },
      {
        before: 'Когда наберешься сил\nЯ каждый день на нервах',
        after: '',
        afterLine: -1,
      },
      {
        before: '[Хук]\nЖаааль\nЧто мой, мир сейчас замерз',
        after: '[Хук]\nЖаааль\nЯ люблю тебя, но не знаю, как быть',
        afterLine: 3,
      },
    ]);
  });

  test('одинаковое число абзацев сохраняет пары', () => {
    const same = '[Хук]\nраз\n\nдва';

    expect(pairRewriteBlocks(same, same)).toEqual([
      { before: '[Хук]\nраз', after: '[Хук]\nраз', afterLine: 0 },
      { before: 'два', after: 'два', afterLine: 3 },
    ]);
  });

  test('номер строки абзаца после нескольких пустых строк', () => {
    const text = '[Куплет]\nраз\nдва\n\n\n\nтри\nчетыре\n\n[Хук]\nхук';
    const lines = text.split('\n');
    const blocks = pairRewriteBlocks(text, text);

    expect(blocks.map((block) => block.afterLine)).toEqual([0, 6, 9]);
    for (const block of blocks) {
      expect(lines[block.afterLine]).toBe(block.after.split('\n')[0]);
    }
  });
});
