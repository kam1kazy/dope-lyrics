import { describe, expect, test } from 'bun:test';

import {
  parseScratchGeneration,
  parseTrackTextGeneration,
  summarizeScratchGeneration,
  summarizeTrackTextGeneration,
} from './generation';

describe('настройки генерации текста', () => {
  test('корректные данные читаются и попадают в сводку', () => {
    const generation = parseTrackTextGeneration(
      JSON.stringify({
        form: { intro: 0, verse: 2, hook: 1, bridge: 0 },
        hideAdlibs: true,
        filters: { selectedTags: ['грусть'], selectedSources: ['TELEGRAM'] },
      })
    );

    expect(generation).not.toBeNull();
    if (!generation) {
      return;
    }

    const summary = summarizeTrackTextGeneration(generation);
    expect(summary.form).toBe('куплет ×2, хук ×1');
    expect(summary.adlibs).toBe('адлибы скрыты');
    expect(summary.filters).toEqual(['теги: грусть', 'источник: Telegram']);
  });

  test('без активных фильтров список пуст', () => {
    const generation = parseTrackTextGeneration('{}');

    expect(generation).not.toBeNull();
    if (!generation) {
      return;
    }

    expect(summarizeTrackTextGeneration(generation).filters).toEqual([]);
  });

  test('частичные данные добираются значениями по умолчанию', () => {
    const generation = parseTrackTextGeneration(
      JSON.stringify({ form: { verse: 3 }, filters: { mood: ['IRONY', 'x'] } })
    );

    expect(generation?.form).toEqual({
      intro: 0,
      verse: 3,
      hook: 1,
      bridge: 0,
    });
    expect(generation?.filters.mood).toEqual(['IRONY']);
    expect(generation?.filters.excludeShelves).toEqual(['hidden', 'donors']);
    expect(generation?.hideAdlibs).toBe(false);
  });

  test('мусор — настроек нет', () => {
    expect(parseTrackTextGeneration(null)).toBeNull();
    expect(parseTrackTextGeneration('не json')).toBeNull();
    expect(parseTrackTextGeneration('[1]')).toBeNull();
    expect(parseTrackTextGeneration('"x"')).toBeNull();
  });

  test('поля не того типа заменяются по умолчанию', () => {
    const generation = parseTrackTextGeneration(
      JSON.stringify({
        form: { verse: -1, hook: 'много' },
        hideAdlibs: 'да',
        filters: { selectedTags: 'грусть', dateSort: 5 },
      })
    );

    expect(generation?.form.verse).toBe(4);
    expect(generation?.form.hook).toBe(1);
    expect(generation?.hideAdlibs).toBe(false);
    expect(generation?.filters.selectedTags).toEqual([]);
  });
});

describe('эталоны в настройках текста', () => {
  test('старый текст без эталонов — пустой фильтр', () => {
    expect(parseTrackTextGeneration('{}')?.references).toEqual({
      artistIds: [],
      textIds: [],
    });
  });

  test('id читаются без мусора и повторов', () => {
    const generation = parseTrackTextGeneration(
      JSON.stringify({
        references: { artistIds: [1, 1, 'x', 2.5, 3], textIds: 'нет' },
      })
    );

    expect(generation?.references).toEqual({ artistIds: [1, 3], textIds: [] });
  });

  test('в сводке имена, удалённые с полки пропадают', () => {
    const generation = parseTrackTextGeneration(
      JSON.stringify({ references: { artistIds: [1, 2], textIds: [7] } })
    );

    expect(generation).not.toBeNull();
    if (!generation) {
      return;
    }

    expect(
      summarizeTrackTextGeneration(generation, {
        artists: new Map([[1, 'Future']]),
        texts: new Map([[7, 'Mask Off']]),
      }).filters
    ).toEqual(['артисты: Future', 'тексты эталонов: «Mask Off»']);
    expect(summarizeTrackTextGeneration(generation).filters).toEqual([]);
  });
});

describe('настройки текста «С нуля»', () => {
  const raw = JSON.stringify({
    kind: 'scratch',
    form: { intro: 0, verse: 4, hook: 1, bridge: 0 },
    facets: { moods: ['EUPHORIA', 'NOPE'], deliveries: [], energies: [] },
    references: { artistIds: [], textIds: [] },
    picked: [
      { textId: 7, artistName: 'SLAVA MARLOW', title: 'БЕЗ АТТЕСТАТА' },
      { textId: 9, artistName: 'Pharaoh', title: null },
    ],
  });

  test('в генератор не возвращаются', () => {
    expect(parseTrackTextGeneration(raw)).toBeNull();
  });

  test('сводка: форма, грани, эталоны запроса', () => {
    const generation = parseScratchGeneration(raw);
    expect(generation).not.toBeNull();
    if (!generation) {
      return;
    }

    const summary = summarizeScratchGeneration(generation);
    expect(summary.form).toBe('куплет ×4, хук ×1');
    expect(summary.facets).toEqual(['настроение: эйфория']);
    expect(summary.references).toEqual([
      'SLAVA MARLOW «БЕЗ АТТЕСТАТА»',
      'Pharaoh',
    ]);
  });

  test('удалённый с полки эталон не показывается', () => {
    const generation = parseScratchGeneration(raw);
    if (!generation) {
      throw new Error('нет настроек');
    }

    expect(
      summarizeScratchGeneration(generation, new Set([9])).references
    ).toEqual(['Pharaoh']);
  });

  test('без граней — пустой список, обычные настройки — не «С нуля»', () => {
    const generation = parseScratchGeneration('{"kind":"scratch"}');
    expect(generation?.facets).toEqual({
      moods: [],
      deliveries: [],
      energies: [],
    });
    expect(parseScratchGeneration('{"form":{}}')).toBeNull();
  });
});
