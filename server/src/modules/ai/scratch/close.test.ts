import { describe, expect, test } from 'bun:test';

import { findCloseLines } from '~/modules/ai/scratch/close';
import type { ScratchChunk } from '~/modules/ai/scratch/pick';

const chunk = (artistName: string, lines: string[]): ScratchChunk => ({
  textId: 1,
  artistId: 1,
  artistName,
  title: null,
  lines,
});

const COLLAGE = [
  chunk('Markul', [
    'Когда нас нету — это факап',
    'Когда мы рядом — это red flag',
    'Лезть под кожу будто тату',
    'Мы оба врём — это дабл кап',
  ]),
  chunk('OG Buda', [
    'Бухой без вина, и это твоя вина',
    "В моём cup'е сейчас яд, и он цвета как малина",
    'Я кручу ещё один в надежде, чтобы убило',
    'Так больно осознать, что ты другого полюбила',
  ]),
];

describe('findCloseLines', () => {
  test('две строки кумира, слитые в одну, и дословное начало — близко', () => {
    const close = findCloseLines(
      '[Куплет]\nБез тебя — факап, с тобой — red flag (флаг)\nМы оба врём — это наш общий талант',
      COLLAGE
    );

    expect(close.map((item) => item.line)).toEqual([0, 1]);
    expect(close[0]?.artistName).toBe('Markul');
    expect(close[0]?.sourceLine).toContain('red flag');
  });

  test('две короткие строки, слитые в одну, — близко, рядом пара', () => {
    const close = findCloseLines('Мы оба врём — это дабл кап, детка', [
      chunk('Markul', ['Мы оба врём', 'это дабл кап']),
    ]);

    expect(close[0]?.sourceLine).toBe('Мы оба врём / это дабл кап');
  });

  test('ядро пересобрано — не близко', () => {
    expect(
      findCloseLines(
        'Это не вино — это твоя вина, полусладкая (буль)\nКручу ещё один — мне надо, а тебе не надо',
        COLLAGE
      )
    ).toEqual([]);
  });

  test('четыре слова подряд — близко, регистр и пунктуация не важны', () => {
    const close = findCloseLines('я КРУЧУ ещё один в надежде на утро', COLLAGE);

    expect(close[0]?.artistName).toBe('OG Buda');
  });

  test('перевод с двумя английскими словами строки — близко, одно слово-ядро — нет', () => {
    const travis = [
      chunk('Travis Scott', [
        'I can see the future',
        "Ridin' with the storm and some troopers",
        "Ridin' through this shit, this shit is stupid",
        "Sky walkin' 'round like I'm Luke-uh",
      ]),
    ];
    const close = findCloseLines(
      'Storm и troopers шагают в мой сон\nStupid shit оставляет ожог\nFuture трубит сквозь дым',
      travis
    );

    expect(close.map((item) => item.line)).toEqual([0, 1]);
    expect(close[0]?.artistName).toBe('Travis Scott');
    expect(close[0]?.sourceLine).toContain("Ridin' with the storm");
  });

  test('метки и пустые строки не считаются в номере строки', () => {
    const close = findCloseLines(
      '[Куплет]\nсвоя строка\n\n[Хук]\nКогда мы рядом — это red flag',
      COLLAGE
    );

    expect(close[0]?.line).toBe(1);
  });
});
