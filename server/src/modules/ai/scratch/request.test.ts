import { describe, expect, test } from 'bun:test';

import type {
  ScratchChunk,
  ScratchCollagePart,
} from '~/modules/ai/scratch/pick';
import {
  buildScratchUser,
  collageSources,
  collageText,
} from '~/modules/ai/scratch/request';

const chunk = (
  textId: number,
  artistName: string,
  lines: string[]
): ScratchChunk => ({
  textId,
  artistId: textId,
  artistName,
  title: `трек ${textId}`,
  lines,
});

const verse = [
  chunk(1, 'Markul', [
    'Я вроде бы свободен, но нет воли',
    'строка 2',
    'строка 3',
  ]),
  chunk(2, 'Платина', ['Ты поверь мне, это не любовь', 'строка 2', 'строка 3']),
];
const hook = [chunk(3, 'Платина', ['Снова ты одна, Валентина', 'х2', 'х3'])];

const PARTS: ScratchCollagePart[] = [
  { role: 'INTRO', chunks: [] },
  { role: 'VERSE', chunks: verse },
  { role: 'HOOK', chunks: hook },
  { role: 'VERSE', chunks: [chunk(1, 'Markul', ['ещё кусок', 'a', 'b'])] },
  { role: 'BRIDGE', chunks: [] },
  { role: 'HOOK', chunks: hook },
];

describe('склейка «С нуля» в запросе', () => {
  test('части с метками, кусок — строфа, второго хука нет', () => {
    const text = collageText(PARTS);

    expect(text.startsWith('[Куплет]\nЯ вроде бы свободен')).toBe(true);
    expect(text).toContain('строка 3\n\nТы поверь мне');
    expect(text.match(/\[Хук\]/g)).toHaveLength(1);
    expect(text).not.toContain('[Интро]');
  });

  test('источники — тексты по разу, в порядке появления', () => {
    expect(collageSources(PARTS).map((source) => source.textId)).toEqual([
      1, 2, 3,
    ]);
  });

  test('в запросе тема, портрет и склейка, без карточек и эталонов', () => {
    const user = buildScratchUser({
      theme: 'фальшивая',
      authorPrompt: 'Dope Den',
      parts: PARTS,
    });

    expect(user).toContain('Тема трека: фальшивая');
    expect(user).toContain('Dope Den');
    expect(user).toContain('Склейка, из которой собрать трек:\n[Куплет]');
    expect(user).not.toContain('Эталон');
    expect(user).not.toContain('Ориентиры этой части');
  });
});
