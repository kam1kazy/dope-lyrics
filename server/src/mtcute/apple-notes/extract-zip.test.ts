import { describe, expect, test } from 'bun:test';
import { zipSync } from 'fflate';

import { extractAppleNotesFromZip } from '~/mtcute/apple-notes/extract-zip';

describe('extractAppleNotesFromZip', () => {
  test('достаёт txt и игнорирует __MACOSX', () => {
    const zip = zipSync({
      '00001 - note.txt': new TextEncoder().encode(
        '---\ncreated: 2024-01-01T00:00:00+03:00\n---\n\nтекст'
      ),
      '__MACOSX/._00001 - note.txt': new TextEncoder().encode('junk'),
      'folder/00002 - second.txt': new TextEncoder().encode('вторая'),
    });

    const files = extractAppleNotesFromZip(zip);

    expect(files.map((file) => file.fileName)).toEqual([
      '00001 - note.txt',
      '00002 - second.txt',
    ]);
    expect(files[0]?.content).toContain('текст');
  });

  test('пустой zip — ошибка', () => {
    const zip = zipSync({ 'readme.md': new TextEncoder().encode('x') });

    expect(() => extractAppleNotesFromZip(zip)).toThrow(/нет \.txt/);
  });
});
