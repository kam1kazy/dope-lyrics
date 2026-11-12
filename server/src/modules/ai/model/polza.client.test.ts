import { describe, expect, test } from 'bun:test';

import {
  buildCompletionBody,
  parseCompletionResponse,
} from '~/modules/ai/model/polza.client';

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

describe('ответ polza', () => {
  const reply = (usage: unknown) => ({
    model: 'm',
    choices: [{ message: { content: 'текст' }, finish_reason: 'stop' }],
    usage,
  });

  test('без поиска приходит plugins: null — ответ разбирается', () => {
    const result = parseCompletionResponse(
      reply({ prompt_tokens: 10, completion_tokens: 5, plugins: null })
    );

    expect(result).toMatchObject({ text: 'текст', tokensIn: 10, tokensOut: 5 });
    expect(result.searchCostRub).toBe(0);
  });

  test('с поиском цена берётся из plugins.web', () => {
    expect(
      parseCompletionResponse(
        reply({ prompt_tokens: 1, plugins: { web: { total_cost_rub: 0.5 } } })
      ).searchCostRub
    ).toBe(0.5);
  });

  test('usage: null тоже не ломает разбор', () => {
    expect(parseCompletionResponse(reply(null)).tokensIn).toBe(0);
  });
});
