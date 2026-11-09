import { describe, expect, test } from 'bun:test';

import { parsePromptMeta } from '~/modules/ai/ai-prompt-meta';

describe('parsePromptMeta', () => {
  test('чистый JSON', () => {
    expect(
      parsePromptMeta('{"name":" Жёстко ","description":"Без морали."}')
    ).toEqual({ name: 'Жёстко', description: 'Без морали.' });
  });

  test('срез блока кода', () => {
    expect(
      parsePromptMeta('```json\n{"name":"А","description":"Б"}\n```')
    ).toEqual({ name: 'А', description: 'Б' });
  });

  test('не JSON и пустое название — ошибка', () => {
    expect(() => parsePromptMeta('Вот название')).toThrow();
    expect(() => parsePromptMeta('{"name":"","description":"Б"}')).toThrow();
  });
});
