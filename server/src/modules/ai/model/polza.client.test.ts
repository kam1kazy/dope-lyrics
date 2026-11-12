import { describe, expect, test } from 'bun:test';

import { buildCompletionBody } from '~/modules/ai/model/polza.client';

describe('тело запроса polza', () => {
  test('без поиска — без plugins', () => {
    const body = buildCompletionBody({ system: 's', user: 'u', maxTokens: 10 });

    expect(body).not.toHaveProperty('plugins');
    expect(body.messages).toEqual([
      { role: 'system', content: 's' },
      { role: 'user', content: 'u' },
    ]);
  });

  test('с поиском — плагин web со своим запросом', () => {
    const body = buildCompletionBody({
      system: 's',
      user: 'длинная инструкция',
      maxTokens: 10,
      webSearch: { query: 'Скриптонит рэп' },
    });

    expect(body).toMatchObject({
      plugins: [{ id: 'web', search_prompt: 'Скриптонит рэп', max_results: 5 }],
    });
  });
});
