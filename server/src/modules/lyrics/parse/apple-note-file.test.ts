import { describe, expect, test } from 'bun:test';

import {
  normalizeAppleNoteText,
  parseAppleNoteFile,
} from '~/modules/lyrics/parse/apple-note-file';

const fallback = new Date('2026-09-07T10:00:00.000Z');

describe('normalizeAppleNoteText', () => {
  test('сводит разделители строк и режет края', () => {
    expect(normalizeAppleNoteText('\u2028строка\r\n\u2029')).toBe('строка');
  });
});

describe('parseAppleNoteFile', () => {
  test('без шапки берёт fallback-дату', () => {
    const parsed = parseAppleNoteFile('  куплет\nвторая  ', fallback);

    expect(parsed.hasMeta).toBe(false);
    expect(parsed.text).toBe('куплет\nвторая');
    expect(parsed.date).toBe(fallback);
    expect(parsed.editDate).toBe(fallback);
  });

  test('читает created и modified из YAML', () => {
    const raw = [
      '---',
      'created: 2024-03-12T18:41:00+03:00',
      'modified: 2024-08-16T18:51:02+03:00',
      '---',
      '',
      'Малышка я стаю у грани',
      '',
    ].join('\n');

    const parsed = parseAppleNoteFile(raw, fallback);

    expect(parsed.hasMeta).toBe(true);
    expect(parsed.text).toBe('Малышка я стаю у грани');
    expect(parsed.date.toISOString()).toBe('2024-03-12T15:41:00.000Z');
    expect(parsed.editDate.toISOString()).toBe('2024-08-16T15:51:02.000Z');
  });

  test('без modified ставит editDate = created', () => {
    const raw = [
      '---',
      'created: 2024-03-12T18:41:00+03:00',
      '---',
      'текст',
    ].join('\n');

    const parsed = parseAppleNoteFile(raw, fallback);

    expect(parsed.hasMeta).toBe(true);
    expect(parsed.editDate.toISOString()).toBe(parsed.date.toISOString());
  });

  test('битая дата в шапке не считается метаданными', () => {
    const raw = ['---', 'created: не дата', '---', 'текст'].join('\n');
    const parsed = parseAppleNoteFile(raw, fallback);

    expect(parsed.hasMeta).toBe(false);
    expect(parsed.text).toContain('текст');
    expect(parsed.date).toBe(fallback);
  });

  test('--- внутри текста не ломает шапку', () => {
    const raw = [
      '---',
      'created: 2024-01-01T00:00:00+03:00',
      '---',
      'куплет',
      '---',
      'припев',
    ].join('\n');

    const parsed = parseAppleNoteFile(raw, fallback);

    expect(parsed.hasMeta).toBe(true);
    expect(parsed.text).toBe('куплет\n---\nприпев');
  });
});
