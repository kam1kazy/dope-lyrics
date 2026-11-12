import { describe, expect, test } from 'bun:test';

import { parseLyricsWebReply } from '~/modules/references/lyrics-web-search';

const LYRICS = Array.from({ length: 12 }, (_, i) => `строка ${i + 1}`).join(
  '\n'
);

describe('ответ веб-поиска текста', () => {
  test('текст песни проходит', () => {
    expect(parseLyricsWebReply(`\`\`\`\n${LYRICS}\n\`\`\``)).toBe(LYRICS);
  });

  test.each([
    'Не могу привести полный текст песни, защищённый авторским правом.',
    'Не могу предоставить полный текст песни, защищённой авторским правом. Могу кратко пересказать её содержание.',
    'Не могу привести полный текст песни из-за авторских прав.',
    'Текст песни не найден в предоставленных результатах поиска.',
    'Текст песни JEEMBO «VENOM» не найден в представленных результатах.',
    'В результатах поиска песня «Ящик» указана у ATL, а не у Horus.',
    "I can't provide the full lyrics because they are copyrighted.",
    'НЕ НАЙДЕН',
  ])('отказ и отчёт о поиске не сохраняются: %s', (reply) => {
    expect(() => parseLyricsWebReply(reply)).toThrow();
  });

  test('отказ в начале длинного ответа тоже не текст', () => {
    expect(() =>
      parseLyricsWebReply(
        `Не могу привести полный текст песни, но могу кратко пересказать:\n${LYRICS}`
      )
    ).toThrow('Вместо текста — отказ или пересказ');
  });

  test('меньше восьми строк — не текст', () => {
    expect(() =>
      parseLyricsWebReply('раз\nдва\nтри\nчетыре\nпять\nшесть\nсемь')
    ).toThrow('Слишком короткий ответ');
  });
});
