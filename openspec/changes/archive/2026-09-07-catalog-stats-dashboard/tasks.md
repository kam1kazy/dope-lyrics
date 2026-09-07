## 1. GraphQL и подсчёт

- [x] 1.1 Расширить `CatalogStats` в `server/src/graphql/typeDefs.ts`: `addedLastMonth`, `themes` (`CatalogThemeCount` с `kind` MOOD|DELIVERY); добавить `catalogActivity(days: Int!): [CatalogActivityPoint!]!`
- [x] 1.2 В `server/src/modules/lyrics/catalog-stats.ts` считать `themes` (уникальная фраза × значение из roleProfiles + корневых mood/delivery); в `lyrics.service.ts` — `addedLastMonth` count и `catalogActivity` с UTC-днями и нулями
- [x] 1.3 Подключить резолвер `catalogActivity` в `server/src/graphql/resolvers.ts`

## 2. Клиентский контракт и chart

- [x] 2.1 Обновить типы и query в `client/src/entities/lyric/model/types.ts` и `api/queries.ts` (`CATALOG_STATS`, `CATALOG_ACTIVITY`)
- [x] 2.2 В `client/`: `bun add recharts` и `bunx --bun shadcn add chart` (новый kit, существующие не править)

## 3. Дашборд UI

- [x] 3.1 Переверстать `client/src/features/catalog-stats/ui/catalog-stats-panel.tsx` (и при необходимости соседние файлы слайса): карточки, график 7/30/90, формы, топ, воронка, без роли, готовность
- [x] 3.2 Проверить в браузере меню → Сводка; `bun run typecheck` в client и server
