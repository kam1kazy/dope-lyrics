import { describe, expect, test } from 'bun:test';

import { usageCostRub } from '~/modules/ai/model/ai-usage.service';

describe('стоимость вызова', () => {
  test('поиск добавляется к оценке, даже если цена токенов не задана', () => {
    expect(usageCostRub(0, 0, 0.5)).toBe(0.5);
  });

  test('без токенов и поиска — суммы нет', () => {
    expect(usageCostRub(0, 0)).toBeNull();
  });
});
