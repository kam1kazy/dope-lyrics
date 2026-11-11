import { describe, expect, test } from 'bun:test';

import {
  parseTrackTextGeneration,
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
