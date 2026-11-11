import { beforeEach, describe, expect, mock, test } from 'bun:test';

import type { RecordUsageInput } from '~/modules/ai/model/ai-usage.service';
import { AiProviderError } from '~/modules/ai/model/polza.client';

const recorded: RecordUsageInput[] = [];
let truncated = false;

void mock.module('~/modules/ai/model/ai-usage.service', () => ({
  recordUsage: (input: RecordUsageInput) => {
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
});
