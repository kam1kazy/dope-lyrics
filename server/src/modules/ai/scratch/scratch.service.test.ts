import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { sample } from '~/modules/ai/artists/fixtures';
import type { ArtistProfile } from '~/modules/ai/artists/profiles';
import type { RecordUsageInput } from '~/modules/ai/model/ai-usage.service';
import { AiProviderError } from '~/modules/ai/model/polza.client';
import { SCRATCH_FRAME_VERSIONS } from '~/modules/ai/scratch/frame';

const recorded: RecordUsageInput[] = [];
let calls = 0;
let fails = false;

void mock.module('~/modules/ai/model/ai-usage.service', () => ({
  recordUsage: (input: RecordUsageInput) => {
    recorded.push(input);
    return Promise.resolve({ id: recorded.length });
  },
}));

void mock.module('~/modules/ai/model/polza.client', () => ({
  AiProviderError,
  isAiConfigured: () => true,
  completeWithModel: () => {
    calls += 1;
    if (fails) {
      return Promise.reject(new AiProviderError('провайдер не ответил'));
    }

    return Promise.resolve({
      text: '[Куплет]\nстрока',
      tokensIn: 100,
      tokensOut: 50,
      model: 'test-model',
      truncated: false,
      searchCostRub: 0,
      costRub: 0.6,
    });
  },
}));

const { assembleScratchRequest, callScratch } =
  await import('~/modules/ai/scratch/scratch.service');

const HIT = { intro: 0, verse: 4, hook: 1, bridge: 0 };

const pool: ArtistProfile[] = [
  {
    id: 1,
    name: 'Платина',
    moods: [],
    energies: [],
    deliveries: [],
    techniques: [{ kind: 'IMAGE', label: 'флекс', instruction: 'приём' }],
    texts: [
      {
        ...sample(11, { mood: ['BRAVADO'] }),
        text: 'Бэнтли, Бенз и Бумер\nвторая\nтретья\nчетвёртая',
      },
    ],
  },
];

const prompt = { id: 5, text: 'портрет' };

beforeEach(() => {
  recorded.length = 0;
  calls = 0;
  fails = false;
});

describe('assembleScratchRequest', () => {
  test('пустая тема — ошибка по-русски', () => {
    expect(() =>
      assembleScratchRequest({ theme: '  ', form: HIT }, pool, prompt)
    ).toThrow('Тема не может быть пустой');
  });

  test('пустая форма — ошибка', () => {
    expect(() =>
      assembleScratchRequest(
        { theme: 'тема', form: { intro: 0, verse: 0, hook: 0, bridge: 0 } },
        pool,
        prompt
      )
    ).toThrow('В форме трека нет частей');
  });

  test('склейка из полки в запросе, приёмов артиста нет, чужие грани отброшены', () => {
    const request = assembleScratchRequest(
      {
        theme: 'остаюсь тру',
        form: HIT,
        facets: { moods: ['BRAVADO', 'NOPE'] },
      },
      pool,
      prompt
    );

    expect(request.sources).toEqual([
      { textId: 11, artistName: 'Платина', title: null },
    ]);
    expect(request.collage).toContain('Бэнтли, Бенз и Бумер');
    expect(request.user).toContain('Склейка, из которой собрать трек:');
    expect(request.user).not.toContain('флекс');
    expect(request.mode).toBe('ANCHORS');
    expect(request.system).toContain('Как работать со склейкой — якоря:');
    expect(request.promptId).toBe(5);
  });

  test('режим «Приёмы» — своя рамка', () => {
    const request = assembleScratchRequest(
      { theme: 'тема', form: HIT, mode: 'SHELF' },
      pool,
      prompt
    );

    expect(request.mode).toBe('SHELF');
    expect(request.system).toContain(
      'Дословно из склейки не оставляй ни одной'
    );
  });

  test('пустая полка — ошибка без вызова модели', () => {
    expect(() =>
      assembleScratchRequest({ theme: 'тема', form: HIT }, [], prompt)
    ).toThrow('На полке нет текстов для склейки');
    expect(calls).toBe(0);
  });
});

describe('callScratch', () => {
  const request = assembleScratchRequest(
    { theme: 'тема', form: HIT },
    pool,
    prompt
  );

  test('один вызов, расход с видом SCRATCH', async () => {
    const result = await callScratch(1, request);

    expect(calls).toBe(1);
    expect(result.value).toBe('[Куплет]\nстрока');
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      kind: 'SCRATCH',
      status: 'OK',
      frameVersion: SCRATCH_FRAME_VERSIONS.ANCHORS,
      promptId: 5,
    });
  });

  test('версия рамки — по режиму', async () => {
    await callScratch(
      1,
      assembleScratchRequest(
        { theme: 'тема', form: HIT, mode: 'SHELF' },
        pool,
        prompt
      )
    );

    expect(recorded[0]?.frameVersion).toBe(SCRATCH_FRAME_VERSIONS.SHELF);
  });

  test('ошибка провайдера тоже пишется в расход', async () => {
    fails = true;

    await expect(callScratch(1, request)).rejects.toThrow(
      'провайдер не ответил'
    );
    expect(recorded[0]).toMatchObject({ kind: 'SCRATCH', status: 'ERROR' });
  });
});
