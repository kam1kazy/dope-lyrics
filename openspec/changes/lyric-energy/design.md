## Context

См. proposal.md — Why. Профиль фразы уже живёт в `lyric-facets`: mood/delivery в массивах и `roleProfiles`, readiness — одно nullable поле. Энергия зеркалит readiness, не mood.

## Goals / Non-Goals

**Goals:**

- Nullable `energy` на `Lyrics`, словарь 5 ступеней, GraphQL enum и фильтр.
- UI: чипы над готовностью; фильтр drawer; сводка с `energy` / `energyNone`.
- Split/slice копируют; glue/create оставляют null.

**Non-Goals:**

- Энергия в `roleProfiles`.
- Отдельный виджет шкалы.
- Автозаполнение при seed или по длине текста.

## Decisions

1. **Одно поле `String?`, не Int 1–5.** Как readiness: enum в GraphQL, русские подписи на клиенте. Альтернатива Int — хуже для исключений из словаря и подсказок.

2. **Не в roleProfiles.** Накал строки общий для фразы; дублировать на каждую роль — шум без выигрыша в фильтре.

3. **Фильтр как readiness.** `energy` / `excludeEnergy`, ИЛИ внутри оси, null проходит exclude. Не смешивать с JSON-гранями ролей.

4. **Сводка отдельным блоком.** Как readiness: столбцы + `energyNone`. Не в themes.

## Risks / Trade-offs

- [Ещё одна ось в drawer] → Mitigation: тот же FacetChipGroup, порядок перед готовностью.
- [Миграция только ADD COLUMN] → Mitigation: nullable, backfill не нужен.

## Migration Plan

1. Prisma migrate: `energy String?`.
2. Деплой GraphQL + клиент вместе (новое поле опционально для старых клиентов).
3. Rollback: колонка nullable, можно оставить; UI без поля просто не шлёт.
