## 1. Сборка на сервере

- [x] 1.1 Чистка текста, квоты пресетов, набор `parts` и повтор хука в `server/src/modules/lyrics/track-assemble.ts`; чтение старого JSON с `lyricId`
- [x] 1.2 GraphQL: `TrackFormPreset`, `AssembledTrackPart`, слот с `parts`, `assembleTrack(preset, hideAdlibs)`, `CollageSlotInput.parts` в `server/src/graphql/typeDefs.ts`
- [x] 1.3 `assembleTrack` / `likeCollage` / hydrate в `server/src/modules/lyrics/lyrics.service.ts` и резолвер в `server/src/graphql/resolvers.ts`
- [x] 1.4 Комментарий JSON в `server/prisma/schema.prisma` (без миграции)

## 2. Клиент: контракт и показ

- [x] 2.1 Типы и query/mutation в `client/src/entities/lyric`
- [x] 2.2 Чистка и текст слота (хештеги, `[]`, switch `()`) в feature `catalog-assemble`

## 3. UI генератора

- [x] 3.1 Панель фильтра генератора (хит / полотно, скрыть адлибы)
- [x] 3.2 `CatalogAssemblePanel`: только сборка и лайк; история убрать из низа
- [x] 3.3 `catalog-menu.tsx`: пункт «Генератор», иконки истории и фильтра в шапке, панели справа

## 4. Проверка

- [x] 4.1 `bun run typecheck` в `server/` и `client/`
