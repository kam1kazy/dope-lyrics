import { describe, expect, test } from 'bun:test';

import {
  buildArtistCardUser,
  parseArtistCard,
} from '~/modules/ai/references/card';
import { parseReferenceTagsReply } from '~/modules/ai/references/tags';

describe('черновик карточки', () => {
  test('неизвестные грани и виды отбрасываются, приёмов не больше пяти', () => {
    const raw = `Вот карточка:\n\`\`\`json\n${JSON.stringify({
      name: 'Скриптонит',
      moods: ['COLD', 'SAD', 'COLD'],
      energies: ['EVEN'],
      deliveries: ['FLOW', 'RAP'],
      techniques: [
        ...Array.from({ length: 6 }, (_, i) => ({
          kind: 'SOUND',
          label: `приём ${i + 1}`,
          instruction: 'сделай',
        })),
        { kind: 'MAGIC', label: 'x', instruction: 'y' },
      ],
    })}\n\`\`\``;
    const card = parseArtistCard(raw);

    expect(card.name).toBe('Скриптонит');
    expect(card.moods).toEqual(['COLD']);
    expect(card.deliveries).toEqual(['FLOW']);
    expect(card.techniques).toHaveLength(5);
    expect(card.techniques.every((item) => item.kind === 'SOUND')).toBe(true);
  });

  test('не JSON — понятная ошибка', () => {
    expect(() => parseArtistCard('не знаю такого')).toThrow(
      'ИИ вернул карточку в неожиданном формате'
    );
    expect(() => parseArtistCard('{"moods": []}')).toThrow(
      'ИИ вернул карточку в неожиданном формате'
    );
  });

  test('в запросе имя и обрезанные тексты артиста', () => {
    const user = buildArtistCardUser('Future', [
      {
        title: 'Mask Off',
        text: Array.from({ length: 20 }, (_, i) => `с${i + 1}`).join('\n'),
      },
    ]);

    expect(user).toContain('Артист: Future');
    expect(user).toContain('Текст 1 — «Mask Off»');
    expect(user).toContain('с16');
    expect(user).not.toContain('с17');
    expect(buildArtistCardUser('Future', [])).toBe('Артист: Future');
  });
});

describe('теги эталона', () => {
  test('берутся только коды словаря', () => {
    expect(
      parseReferenceTagsReply(
        '{"mood": ["IRONY", "FUN"], "delivery": ["PUNCH"], "songRole": ["HOOK", "OUTRO"], "energy": "LOUD"}'
      )
    ).toEqual({
      mood: ['IRONY'],
      delivery: ['PUNCH'],
      songRole: ['HOOK'],
      energy: 'LOUD',
    });
  });

  test('неизвестная энергия — без энергии', () => {
    expect(parseReferenceTagsReply('{"energy": "MAX"}')).toEqual({
      mood: [],
      delivery: [],
      songRole: [],
      energy: null,
    });
  });
});
