## Context

См. proposal.md — Why. Карточка: `message-desk-dialog.tsx`, линия — `split-text-view.tsx`, разрез — `splitLyric`. Склейка генератора уже умеет вырез и `isDonor` (`lyric-glue.ts`, `glueLyrics`). Telegram в этом change не участвует.

## Goals / Non-Goals

**Goals:**

- Мутация `sliceLyric` с массивом диапазонов сразу (заход 2 не ломает контракт).
- Заход 1: UI второй черты + один range.
- Заходы 2–3: список, опасити, reorder на `framer-motion`.
- Remap коллажей через существующие хелперы выреза.

**Non-Goals:**

- Новая таблица Prisma; расширение `splitLyric`; dnd-библиотека; склейка генератора.

## Decisions

1. **Отдельная мутация `sliceLyric`**, не `untilLine` на `splitLyric` — семантика другая (остаток + фрагмент vs верх/низ, плюс `ripDonor` и несколько ranges).
2. **Индексы диапазона** — сырые `\n`-строки, как `afterLine` у разреза: фрагмент `lines.slice(afterLine + 1, untilLine + 1)`. Для выреза из донора маппим на очищенные через `mapRawLinesToCleaned` / `ripCleanedRangesFromText`.
3. **Payload** `{ source, created }` — `source` всегда исходный id (возможно с дырками); карточка остаётся на `source`.
4. **Заход 1 без списка** — две черты → «Разделить» → оверлей Оставить/Вырезать → один range. Заход 2 меняет кнопку: ножницы кладут в список, «Сохранить» шлёт все ranges.
5. **Reorder** — `framer-motion` `Reorder`, без `@dnd-kit`.
6. **Копирование полей** на `created` — как низ у `splitLyric` (теги, профиль, полки, `lyric_id`); медиа/реакции не копируем.

## Risks / Trade-offs

- [Риск] Сырые vs очищенные индексы при remap → Mitigation: те же хелперы, что glue; тесты на хештеги/пустые строки.
- [Риск] Пересечение кусков в списке → Mitigation: клиент блокирует уже взятые строки; сервер отклоняет overlapping ranges.
- [Риск] Заход 1 UI потом меняется под список → Mitigation: контракт ranges[] стабилен; UI локальный.

## Migration Plan

1. GraphQL + сервис + тесты.
2. UI захода 1.
3. Список и reorder.
4. Откат: убрать мутацию и кнопки; уже созданные записи остаются.
