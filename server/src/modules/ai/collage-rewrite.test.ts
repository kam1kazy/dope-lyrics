import { describe, expect, test } from 'bun:test';

import { rankArtistCandidates } from '~/modules/ai/artist-orientation';
import {
  buildRewriteSystem,
  buildRewriteUser,
  COLLAGE_REWRITE_FRAME,
  collectRewriteSections,
  sectionsToText,
  stripModelWrapper,
} from '~/modules/ai/collage-rewrite';
import type { CollageSlotStored } from '~/modules/lyrics/track-assemble';

const emptySlot = (songRole: CollageSlotStored['songRole']) => ({
  songRole,
  parts: [],
});

const slotsWith = (
  verse: CollageSlotStored['parts'],
  hook: CollageSlotStored['parts']
): CollageSlotStored[] => [
  emptySlot('INTRO'),
  { songRole: 'VERSE', parts: verse },
  { songRole: 'HOOK', parts: hook },
  emptySlot('VERSE'),
  emptySlot('BRIDGE'),
  { songRole: 'HOOK', parts: hook },
];

const sourceText = (
  slots: CollageSlotStored[],
  texts: ReadonlyMap<number, string>,
  hideAdlibs: boolean
): string => sectionsToText(collectRewriteSections(slots, texts, hideAdlibs));

describe('текст склейки', () => {
  const texts = new Map([
    [1, 'раз\nдва #тег\nтри\nчетыре\nпять'],
    [2, 'хук (эй)\nхук два'],
  ]);

  test('метки ролей, чистка хештегов, второй хук не дублируется', () => {
    const slots = slotsWith(
      [{ lyricId: 1, startLine: 0, endLine: 5 }],
      [{ lyricId: 2, startLine: 0, endLine: 2 }]
    );

    expect(sourceText(slots, texts, false)).toBe(
      '[Куплет]\nраз\nдва\nтри\nчетыре\n\nпять\n\n[Хук]\nхук (эй)\nхук два'
    );
  });

  test('адлибы скрываются по флагу', () => {
    const slots = slotsWith([], [{ lyricId: 2, startLine: 0, endLine: 2 }]);

    expect(sourceText(slots, texts, true)).toBe('[Хук]\nхук\nхук два');
  });

  test('пустая склейка и удалённая фраза дают пустой текст', () => {
    const slots = slotsWith([{ lyricId: 99, startLine: 0, endLine: 2 }], []);

    expect(sourceText(slots, texts, false)).toBe('');
  });
});

describe('stripModelWrapper', () => {
  test('срезает «Вот текст:»', () => {
    expect(stripModelWrapper('Вот текст:\n[Хук]\nстрока')).toBe(
      '[Хук]\nстрока'
    );
  });

  test('срезает блок кода', () => {
    expect(stripModelWrapper('```\n[Хук]\nстрока\n```')).toBe('[Хук]\nстрока');
  });

  test('срезает «Вот текст:» и блок кода вместе', () => {
    expect(stripModelWrapper('Вот текст:\n```\n[Хук]\nстрока\n```')).toBe(
      '[Хук]\nстрока'
    );
  });

  test('чистый текст не трогает', () => {
    expect(stripModelWrapper('[Хук]\nстрока')).toBe('[Хук]\nстрока');
  });
});

describe('сборка запроса', () => {
  test('в системе только правила редактора', () => {
    const system = buildRewriteSystem();

    expect(system).toBe(COLLAGE_REWRITE_FRAME);
    expect(system).toContain('готовый рэп-трек');
    expect(system).toContain(
      'Строка не остаётся только потому, что написана, и не уходит только потому, что странная'
    );
    expect(system).toContain('Образ с подтекстом уже кадр');
    expect(system).toContain(
      'Оставить строку — не значит оставить все её слова'
    );
    expect(system).toContain('Не своди текст к парным двустишиям');
    expect(system).toContain('Ради рифмы её не выбрасывай');
    expect(system).not.toContain('читается из поступка');
    expect(system).toContain('не «я люблю тебя»');
    expect(system).toContain('Герой — персонаж, не исповедь');
    expect(system).toContain('Флекс — способ думать, не список брендов');
    expect(system).toContain('Абсурд разрешён');
    expect(system).toContain('Дежурный атрибут рэпера');
    expect(system).toContain('Литературную метафору не придумывай');
    expect(system).toContain('Повтор в хуке меняет оттенок');
    expect(system).not.toContain('Чужой образ жизни не подставляй');
    expect(system).not.toContain('Новую тему не открывай');
    expect(system).not.toContain('dark trap');
    expect(system).toContain('«быть / любить»');
    expect(system).not.toContain('Каждое четверостишие держит свою мысль');
    expect(system).not.toContain('Смысл строки можно сдвинуть');
    expect(system).toContain('Буква в букву оставь звук находки');
    expect(system).toContain('Повтор буквы — протянуть и пропеть звук');
    expect(system).toContain('Заглавная внутри слова — ударение или акцент');
    expect(system).toContain('Не ставь их в каждую');
    expect(system).toContain('метки частей');
    expect(system).not.toContain('Сдержанно');
    expect(system).not.toContain('Активно');
    expect(system).not.toContain('Жёстко');
    expect(system).not.toContain('Промпт автора');
  });

  test('тема, предпочтения и заметки не объявлены эталоном', () => {
    const bare = buildRewriteUser({
      theme: null,
      authorPrompt: '  ',
      sections: [{ label: 'Хук', text: 'х', artists: [], relaxed: false }],
    });
    expect(bare).toBe('Склейка, из которой собрать трек:\n[Хук]\nх');

    const full = buildRewriteUser({
      theme: 'бросил работу',
      authorPrompt: 'не трогай слабое',
      sections: [{ label: 'Хук', text: 'х', artists: [], relaxed: false }],
    });
    expect(full).toContain('Тема трека: бросил работу');
    expect(full).toContain('Творческие предпочтения автора');
    expect(full).toContain('Отсюда персонаж, его мир и вкус трека');
    expect(full).toContain('не трогай слабое');
    expect(full).not.toContain('Мои эталоны');
    expect(buildRewriteSystem()).not.toContain('не трогай слабое');
  });

  test('в части три приёма с подписью вида', () => {
    const { artists, relaxed } = rankArtistCandidates({
      moods: ['LONGING'],
      energies: ['QUIET'],
      deliveries: ['TUNE'],
    });

    const user = buildRewriteUser({
      theme: null,
      authorPrompt: '',
      sections: [{ label: 'Хук', text: 'х', artists, relaxed }],
    });
    const cardLines = user.split('\n').filter((line) => line.startsWith('- '));

    expect(cardLines).toHaveLength(3);
    expect(cardLines.some((line) => line.startsWith('- образ · '))).toBe(true);
    expect(cardLines.some((line) => line.startsWith('- звук · '))).toBe(true);
    expect(cardLines.some((line) => line.startsWith('- игра слов · '))).toBe(
      true
    );
    expect(user).toContain('приём на образ, на звук и на игру слов');
  });
});
