## Context

См. proposal.md — Why. Живые `catalogStats` и `CatalogStatsPanel` уже считают полки, роли, unscoped и readiness. Нужен дашборд и два расширения API: дельта/темы в том же query и отдельный ряд активности. Telegram не участвует — только GraphQL и Postgres.

## Goals / Non-Goals

**Goals:**

- Один запрос сводки + лёгкий query графика; без выгрузки всего корпуса на клиент ради UI.
- Area chart через shadcn chart + recharts; существующие kit-файлы не править.
- Топ mood+delivery уникальными фразами; роли на экране — имя и count.

**Non-Goals:**

- Prisma-миграция; фильтр периода на всю сводку; хештеги в топе; drill-down в список.
- Править существующие файлы в `shared/ui/shadcn/ui` (кроме добавления нового `chart.tsx`).

## Decisions

### 1. `addedLastMonth` и `themes` в `catalogStats`

Дельта — отдельный `prisma.lyrics.count({ where: { date: { gte } } })` рядом с `findMany` для `buildCatalogStats`, не тащить `date` во все строки агрегата ролей.

`themes` считаем в `buildCatalogStats`: для каждой фразы собираем Set mood и Set delivery из корневых массивов и всех слотов `roleProfiles`, затем +1 к глобальным счётчикам. В ответе — полный словарь с нулями; UI режет и сортирует.

Альтернатива «второй query на темы» отвергнута: темы меняются вместе с корпусом, лишний round-trip не нужен.

### 2. Отдельный `catalogActivity(days)`

Аргумент только 7 | 30 | 90. `findMany({ where: { date: { gte } }, select: { date: true } })`, корзины по UTC `YYYY-MM-DD`, затем заполнение дыр нулями. `groupBy` по `DateTime` не подходит (не день).

Смена периода на клиенте не инвалидирует `catalogStats`.

### 3. UI без новых Card/Progress kit

Карточки — `rounded-lg border` как сейчас. Полосы — `div` с шириной `count / max`. Селект периода графика — кнопки или Popover, без Select kit.

График: `bunx --bun shadcn add chart` в `client/` + `bun add recharts`. Цвета `--chart-*` уже в `globals.css`.

### 4. Роли на экране без вложенных граней

API `roles[].mood` / `delivery` оставляем (обратная совместимость, конструктор не зависит). Дашборд рисует только `songRole` + `phraseCount`, сортировка по count убыв.

## Risks / Trade-offs

- [Двойной счёт фразы в двух ролях] → как раньше; подпись «формы (роли)» — куски, не уникальные тексты.
- [Топ считает фразу один раз на значение, роли — нет] → намеренно разные корзины; не смешивать в одном блоке.
- [Активность по UTC] → подписи «05 авг» от UTC-дня; локальный сдвиг границы суток приемлем для прототипа.
- [Полный `findMany` дат за 90 дней] → для личного каталога (~тысячи) ок; если вырастет — raw SQL `date_trunc`.

## Migration Plan

1. Расширить GraphQL и `buildCatalogStats` / `catalogActivity`.
2. Добавить chart kit + recharts.
3. Переверстать `CatalogStatsPanel`.
4. Откат: убрать поля/query и вернуть плоскую панель; профиль фраз не зависит от дашборда.

## Open Questions

Нет.
