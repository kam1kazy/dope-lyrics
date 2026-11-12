import { describe, expect, test } from 'bun:test';

import { LINE_MARKS_FRAME } from '~/modules/ai/line-marks/frame';
import {
  applyLineMarksAnswer,
  buildLineMarksUser,
  type LineMark,
  validateMarks,
} from '~/modules/ai/line-marks/request';

const AI_TEXT = [
  '[Куплет]',
  'первая строка',
  'вторая строка',
  '',
  'третья строка',
  '[Хук]',
  'хук раз',
].join('\n');

const marks = (entries: [number, LineMark][]) =>
  new Map<number, LineMark>(entries);

const answer = (lines: { n: number; text: string }[]) =>
  JSON.stringify({ lines });

describe('validateMarks', () => {
  test('индексы строк, красная обязательна', () => {
    const result = validateMarks(AI_TEXT, [
      { line: 1, mark: 'RED' },
      { line: 4, mark: 'GREEN' },
    ]);

    expect([...result]).toEqual([
      [1, 'RED'],
      [4, 'GREEN'],
    ]);
    expect(() => validateMarks(AI_TEXT, [{ line: 4, mark: 'GREEN' }])).toThrow(
      'Отметьте красным хотя бы одну строку'
    );
  });

  test('метку части, пустую строку и чужой индекс пометить нельзя', () => {
    for (const line of [0, 3, 5, 99, -1]) {
      expect(() => validateMarks(AI_TEXT, [{ line, mark: 'RED' }])).toThrow(
        'нельзя пометить'
      );
    }
  });
});

describe('applyLineMarksAnswer', () => {
  test('меняются только красные, число строк прежнее', () => {
    const result = applyLineMarksAnswer(
      answer([
        { n: 1, text: 'новая первая' },
        { n: 2, text: 'изменённая вторая' },
        { n: 6, text: 'изменённый хук' },
      ]),
      AI_TEXT,
      marks([
        [1, 'RED'],
        [4, 'GREEN'],
      ])
    );
    const lines = result.split('\n');

    expect(lines).toHaveLength(AI_TEXT.split('\n').length);
    expect(lines[1]).toBe('новая первая');
    expect(lines[2]).toBe('вторая строка');
    expect(lines[4]).toBe('третья строка');
    expect(lines[6]).toBe('хук раз');
    expect(lines[0]).toBe('[Куплет]');
  });

  test('ответ в блоке кода разбирается', () => {
    const result = applyLineMarksAnswer(
      '```json\n' + answer([{ n: 2, text: 'новая' }]) + '\n```',
      AI_TEXT,
      marks([[2, 'RED']])
    );

    expect(result.split('\n')[2]).toBe('новая');
  });

  test('текст вокруг JSON не мешает', () => {
    const result = applyLineMarksAnswer(
      `Вот правки:\n${answer([{ n: 2, text: 'новая' }])}\nГотово.`,
      AI_TEXT,
      marks([[2, 'RED']])
    );

    expect(result.split('\n')[2]).toBe('новая');
  });

  test('нет строки для красной, пустая, с переносом или не JSON — ошибка', () => {
    const red = marks([
      [1, 'RED'],
      [2, 'RED'],
    ]);

    expect(() =>
      applyLineMarksAnswer(answer([{ n: 1, text: 'ок' }]), AI_TEXT, red)
    ).toThrow('не вернул новую строку 3');
    expect(() =>
      applyLineMarksAnswer(
        answer([
          { n: 1, text: 'ок' },
          { n: 2, text: '  ' },
        ]),
        AI_TEXT,
        red
      )
    ).toThrow('не вернул новую строку 3');
    expect(() =>
      applyLineMarksAnswer(
        answer([
          { n: 1, text: 'ок' },
          { n: 2, text: 'раз\nдва' },
        ]),
        AI_TEXT,
        red
      )
    ).toThrow('не вернул новую строку 3');
    expect(() => applyLineMarksAnswer('Вот правки', AI_TEXT, red)).toThrow(
      'неожиданном формате'
    );
  });
});

describe('запрос пометок', () => {
  test('строки с номерами и знаками меток, тема и промпт', () => {
    const user = buildLineMarksUser({
      theme: 'уход',
      authorPrompt: 'грубее',
      aiText: AI_TEXT,
      marks: marks([
        [1, 'RED'],
        [4, 'GREEN'],
      ]),
    });

    expect(user).toContain('Тема трека: уход');
    expect(user).toContain('Творческие предпочтения автора');
    expect(user).toContain('1 | R | первая строка');
    expect(user).toContain('2 | · | вторая строка');
    expect(user).toContain('4 | G | третья строка');
    expect(user).toContain('0 | · | [Куплет]');
  });

  test('в рамке нет строк из склеек и есть формат ответа', () => {
    expect(LINE_MARKS_FRAME).toContain('{"lines":[{"n":номер,"text":');
    for (const sample of ['Кто ты', 'почИтать', 'быыыыть']) {
      expect(LINE_MARKS_FRAME).not.toContain(sample);
    }
  });
});
