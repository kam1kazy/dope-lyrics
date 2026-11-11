import { describe, expect, test } from 'bun:test';

import {
  buildRewriteSystem,
  COLLAGE_REWRITE_FRAME,
} from '~/modules/ai/rewrite/frame';

describe('рамка правки', () => {
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
});
