## 1. Prisma и словари

- [x] 1.1 Добавить `energy String?` на `Lyrics` в `server/prisma/schema.prisma`; миграция из `server/`
- [x] 1.2 Словарь `LYRIC_ENERGIES`, тип и `isLyricEnergy` / парсинг в `server/src/modules/lyrics/lyric-facets.ts`
- [x] 1.3 Зеркало словаря, подписи и хинты в `client/src/shared/lib/lyric-facets.ts`

## 2. GraphQL и сервис

- [x] 2.1 Enum, поле `energy`, фильтры, `updateLyricProfile`, сводка в `server/src/graphql/typeDefs.ts`
- [x] 2.2 Резолверы и типы: `resolvers.ts`, `lyrics.types.ts`, `lyrics.service.ts` (patch + select)
- [x] 2.3 Фильтр `energy` / `excludeEnergy` в `lyrics-list-filters.ts`
- [x] 2.4 Счётчики в `catalog-stats.ts`
- [x] 2.5 Split/slice копируют `energy`; glue/create оставляют null

## 3. Клиент

- [x] 3.1 Типы, фрагменты запросов, `updateLyricProfile`, фильтры в `client/src/entities/lyric`
- [x] 3.2 Чипы энергии над готовностью в `message-desk-dialog.tsx`
- [x] 3.3 Фильтр drawer: `lyric-filter-fields.tsx`, `catalog-section-filters.ts`, `lyrics-query-variables.ts`, `lyric-list.tsx`, кэш
- [x] 3.4 Сводка в `catalog-stats-panel.tsx`; `energy: null` в `collage-to-carousel-lyric.ts`
- [x] 3.5 Экспорт словаря из `client/src/entities/lyric/index.ts`

## 4. Документация и проверка

- [x] 4.1 Убрать «энергию опускаем» из `docs/roadmap.md`, `docs/tasks/current_task.md`, `docs/status.md`
- [x] 4.2 `bun run typecheck` в `server/` и `client/`
- [x] 4.3 В браузере: поставить/снять энергию, фильтр, сводка, разрез копирует
