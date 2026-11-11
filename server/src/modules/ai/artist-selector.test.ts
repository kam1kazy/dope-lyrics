import { describe, expect, test } from 'bun:test';

import { ARTIST_PROFILES } from '~/modules/ai/artist-orientation';
import {
  orientationFromSelection,
  sanitizeSelectorBrief,
} from '~/modules/ai/artist-selector';

const known = ['1:VERSE', '2:HOOK'];

describe('sanitizeSelectorBrief', () => {
  test('оставляет известные приёмы и не больше двух артистов', () => {
    const raw = JSON.stringify({
      sections: [
        {
          sectionId: '1:VERSE',
          editingIntensity: 'moderate',
          selected: [
            {
              artistId: 'future',
              techniques: ['numb-longing', 'нет-такого', 'short-repeat'],
            },
            { artistId: 'чужой', techniques: ['numb-longing'] },
            {
              artistId: 'che-ecru',
              techniques: ['quiet-intimacy'],
            },
            {
              artistId: 'scriptonite',
              techniques: ['cold-short-line'],
            },
          ],
        },
        {
          sectionId: '9:BRIDGE',
          selected: [{ artistId: 'future', techniques: ['numb-longing'] }],
        },
      ],
    });

    const brief = sanitizeSelectorBrief(raw, known);

    expect(brief).toEqual([
      {
        sectionId: '1:VERSE',
        intensity: 'moderate',
        artists: [
          {
            artistId: 'future',
            name: 'Future',
            labels: [
              'онемение и токсичная тяга',
              'короткий повтор вместо сюжета',
            ],
          },
          {
            artistId: 'che-ecru',
            name: 'Che Ecru',
            labels: ['тихая интимность'],
          },
        ],
      },
    ]);
  });

  test('битый JSON и пустой выбор дают null', () => {
    expect(sanitizeSelectorBrief('не json', known)).toBeNull();
    expect(
      sanitizeSelectorBrief(
        '{"sections":[{"sectionId":"1:VERSE","selected":[]}]}',
        known
      )
    ).toBeNull();
  });

  test('срезает markdown-обёртку', () => {
    const raw =
      '```json\n{"sections":[{"sectionId":"2:HOOK","selected":[{"artistId":"atl","techniques":["short-hook"]}]}]}\n```';

    expect(sanitizeSelectorBrief(raw, known)?.[0]?.artists[0]?.name).toBe(
      'ATL'
    );
  });
});

describe('orientationFromSelection', () => {
  test('подписи идут в порядке частей', () => {
    const text = orientationFromSelection(
      [
        { sectionId: '1:VERSE', label: 'Куплет' },
        { sectionId: '2:HOOK', label: 'Хук' },
      ],
      [
        {
          sectionId: '2:HOOK',
          intensity: 'high',
          artists: [{ artistId: 'atl', name: 'ATL', labels: ['короткий хук'] }],
        },
        {
          sectionId: '1:VERSE',
          intensity: 'radical',
          artists: [
            {
              artistId: 'future',
              name: 'Future',
              labels: ['онемение и токсичная тяга'],
            },
          ],
        },
      ]
    );

    expect(text?.indexOf('[Куплет]')).toBeLessThan(
      text?.indexOf('[Хук]') ?? -1
    );
    expect(text).toContain('Future — онемение и токсичная тяга');
    expect(text).toContain('Активно');
    expect(text).not.toContain('Скриптонит');
  });
});

describe('карточки артистов', () => {
  test('у каждого не больше пяти приёмов и id уникальны', () => {
    const ids = new Set<string>();

    for (const artist of ARTIST_PROFILES) {
      expect(artist.techniques.length).toBeGreaterThan(0);
      expect(artist.techniques.length).toBeLessThanOrEqual(5);
      expect(ids.has(artist.id)).toBe(false);
      ids.add(artist.id);
    }

    expect(ids.size).toBe(26);
  });
});
