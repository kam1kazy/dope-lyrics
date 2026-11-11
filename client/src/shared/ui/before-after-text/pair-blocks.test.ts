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
      },
      {
        before: 'Когда наберешься сил\nЯ каждый день на нервах',
        after: '',
      },
      {
        before: '[Хук]\nЖаааль\nЧто мой, мир сейчас замерз',
        after: '[Хук]\nЖаааль\nЯ люблю тебя, но не знаю, как быть',
      },
    ]);
  });

  test('одинаковое число абзацев сохраняет пары', () => {
    const same = '[Хук]\nраз\n\nдва';

    expect(pairRewriteBlocks(same, same)).toEqual([
      { before: '[Хук]\nраз', after: '[Хук]\nраз' },
      { before: 'два', after: 'два' },
    ]);
  });
});
