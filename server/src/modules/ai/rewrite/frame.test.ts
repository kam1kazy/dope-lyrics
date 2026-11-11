import { describe, expect, test } from 'bun:test';

import {
  buildRewriteSystem,
  COLLAGE_REWRITE_FRAME,
  FRAME_VERSION,
} from '~/modules/ai/rewrite/frame';

describe('рамка правки', () => {
  test('версия — MAJOR.MINOR.PATCH', () => {
    expect(FRAME_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('в системе только правила редактора', () => {
    const system = buildRewriteSystem();

    expect(system).toBe(COLLAGE_REWRITE_FRAME);
    expect(system).toContain('готовый рэп-трек');
    expect(system).not.toContain('Промпт автора');
    expect(system).toContain('метки частей');
  });

  test('строки пересобираются вокруг ядра, а не пересказываются', () => {
    const system = buildRewriteSystem();

    expect(system).toContain('Дословно из склейки остаётся не больше трети');
    expect(system).toContain('образ с подтекстом. Их не трогай');
    expect(system).toContain('Вокруг ядра строку строй заново');
    expect(system).toContain('Ядро не переводи и не заменяй синонимом');
    expect(system).toContain('Пересказ строки другими словами — не правка');
    expect(system).toContain('на одной ударной гласной в концах');
    expect(system).toContain('Слова-затычки ради рифмы');
    expect(system).toContain('Хук склейки — тоже черновик');
    expect(system).toContain('Повтор меняет оттенок');
  });

  test('образ без быта и без расшифровки', () => {
    const system = buildRewriteSystem();

    expect(system).toContain('Не дописывай обстановку и бытовые действия');
    expect(system).toContain('не уточняй, что за ним стоит');
    expect(system).toContain('Литературную метафору не придумывай');
    expect(system).toContain('не дежурным атрибутом');
    expect(system).toContain('не смягчай и не прикрывай оговоркой');
    expect(system).toContain('вопрос к себе не становится признанием любви');
  });

  test('строк из тестовых склеек в рамке нет', () => {
    const system = buildRewriteSystem();

    for (const sample of [
      'Кто ты',
      'почИтать',
      'быыыыть',
      'Жааааль',
      'замЕр',
    ]) {
      expect(system).not.toContain(sample);
    }
  });
});
