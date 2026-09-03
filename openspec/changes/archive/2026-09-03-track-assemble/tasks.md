## 1. Prisma и словари

- [x] 1.1 Модель `LyricCollage` в `server/prisma/schema.prisma` (`id`, `createdAt`, `slots Json`)
- [x] 1.2 Миграция + `bun prisma generate` из `server/`
- [x] 1.3 Каркас и сборка пулов в `server/src/modules/lyrics/track-assemble.ts`

## 2. GraphQL и сервис

- [x] 2.1 Типы `AssembledTrack`, `LyricCollage`, input слотов; query `assembleTrack`, `lyricCollages`; mutation `likeCollage` в `typeDefs.ts`
- [x] 2.2 Методы в `lyrics.service.ts` (или соседний service): assemble, like, list
- [x] 2.3 Резолверы в `resolvers.ts`

## 3. Клиент

- [x] 3.1 Query/mutation и типы в `client/src/entities/lyric`
- [x] 3.2 Панель сборки + история в `client/src/features/catalog-assemble`
- [x] 3.3 Живой пункт «История» в `catalog-menu.tsx` (снять disabled)

## 4. Проверка

- [x] 4.1 `bun run typecheck` в `server/` и `client/`
- [x] 4.2 Пустые пулы, повтор «Собрать», лайк в истории, карусель/сводка целы
