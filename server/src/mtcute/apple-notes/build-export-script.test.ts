import { describe, expect, test } from 'bun:test';

import {
  buildAppleNotesExportScript,
  buildNotesFolderExpression,
  DEFAULT_NOTES_FOLDER_PATH,
  parseNotesFolderPath,
} from '~/mtcute/apple-notes/build-export-script';

describe('parseNotesFolderPath', () => {
  test('дефолт Музыка/Рэпчик', () => {
    expect(parseNotesFolderPath(undefined)).toEqual(
      DEFAULT_NOTES_FOLDER_PATH.split('/')
    );
  });

  test('режет сегменты', () => {
    expect(parseNotesFolderPath('  А / Б / В  ')).toEqual(['А', 'Б', 'В']);
  });
});

describe('buildNotesFolderExpression', () => {
  test('строит вложенность Notes', () => {
    expect(buildNotesFolderExpression(['Музыка', 'Рэпчик'])).toBe(
      'folder "Рэпчик" of folder "Музыка"'
    );
  });
});

describe('buildAppleNotesExportScript', () => {
  test('подставляет папку и Desktop export', () => {
    const built = buildAppleNotesExportScript('Музыка/Рэпчик');

    expect(built.folderLabel).toBe('Музыка / Рэпчик');
    expect(built.outputFolderLabel).toBe('Desktop/Dope Notes Export');
    expect(built.script).toContain('folder "Рэпчик" of folder "Музыка"');
    expect(built.script).toContain('Dope Notes Export/');
  });
});
