import { beforeEach, describe, expect, mock, test } from 'bun:test';

import type { RecordUsageInput } from '~/modules/ai/model/ai-usage.service';
import { AiProviderError } from '~/modules/ai/model/polza.client';

const recorded: RecordUsageInput[] = [];
let truncated = false;
let okRecordFails = false;

void mock.module('~/modules/ai/model/ai-usage.service', () => ({
  recordUsage: (input: RecordUsageInput) => {
    if (okRecordFails && input.status === 'OK') {
      return Promise.reject(new Error('база недоступна'));
    }

    recorded.push(input);
    return Promise.resolve({ id: recorded.length });
  },
}));

void mock.module('~/modules/ai/model/polza.client', () => ({
  AiProviderError,
  completeWithModel: () =>
    Promise.resolve({
      text: 'ответ',
      tokensIn: 120,
      tokensOut: 40,
      model: 'test-model',
      truncated,
      searchCostRub: 0,
    }),
}));

const { callModel } = await import('~/modules/ai/model/model-call');

const input = {
  userId: 1,
  kind: 'COLLAGE_REWRITE',
  frameVersion: '1.0.0',
  promptId: null,
  system: 's',
  user: 'u',
  maxTokens: 10,
} as const;

beforeEach(() => {
  recorded.length = 0;
  truncated = false;
  okRecordFails = false;
});

describe('callModel', () => {
  test('успех пишет OK с токенами и отдаёт разобранный ответ', async () => {
    const result = await callModel(input, (text) => text.toUpperCase());

    expect(result).toEqual({ value: 'ОТВЕТ', usageId: 1 });
    expect(recorded[0]).toMatchObject({
      status: 'OK',
      tokensIn: 120,
      tokensOut: 40,
    });
  });

  test('ответ пришёл, разбор упал — токены всё равно учтены', async () => {
    const failing = callModel(input, () => {
      throw new AiProviderError('ИИ вернул пустой ответ');
    });

    expect(failing).rejects.toThrow('ИИ вернул пустой ответ');
    await failing.catch(() => undefined);
    expect(recorded[0]).toMatchObject({
      status: 'ERROR',
      model: 'test-model',
      tokensIn: 120,
      tokensOut: 40,
      error: 'ИИ вернул пустой ответ',
    });
  });

  test('ответ оборван на лимите — ошибка, токены учтены', async () => {
    truncated = true;
    const failing = callModel(input, (text) => text);

    expect(failing).rejects.toThrow('оборвал ответ');
    await failing.catch(() => undefined);
    expect(recorded[0]).toMatchObject({ status: 'ERROR', tokensOut: 40 });
  });

  test('учёт успеха упал — ошибка базы не пишется как ошибка модели', async () => {
    okRecordFails = true;

    await expect(callModel(input, (text) => text)).rejects.toThrow(
      'база недоступна'
    );
    expect(recorded).toHaveLength(0);
  });
});
