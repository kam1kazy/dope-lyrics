## 1. Схема и серверные хелперы

- [x] 1.1 Добавить `isDonor Boolean @default(false)` на `Lyrics` в `server/prisma/schema.prisma` и миграцию
- [x] 1.2 Хелперы склейки текста, вырезания по очищенным строкам и перекладки коллажей рядом с `server/src/modules/lyrics/track-assemble.ts` / `lyric-text.ts`; тесты по образцу `track-assemble.test.ts`
- [x] 1.3 `glueLyrics(slots, hideOriginals)` в `server/src/modules/lyrics/lyrics.service.ts` (транзакция, владелец)
- [x] 1.4 GraphQL: поле `isDonor`, `updateLyricFlags`, полка `donors` в фильтрах, `catalogStats.donors`, мутация `glueLyrics` в `typeDefs.ts` / `resolvers.ts`

## 2. Клиент: генератор

- [x] 2.1 Мутация `GLUE_LYRICS`, типы и фрагмент `LyricListFields` с `isDonor` в `client/src/entities/lyric/`
- [x] 2.2 Кнопка «Склеить» слева от сердца и модалка «Оригиналы скрыть?» в `catalog-assemble-panel.tsx`

## 3. Клиент: донор в каталоге

- [x] 3.1 Полка `donors` в `shelf-filter.ts`, чипах фильтра и серверном `lyrics-list-filters.ts`
- [x] 3.2 «Цензура» и «Донор» в меню «Ещё…» карточки; счётчик в сводке (`catalog-stats` + UI)
- [x] 3.3 Обновление кэша Apollo после `glueLyrics` / флагов

## 4. Проверка

- [x] 4.1 `bun run typecheck` в `server/` и `client/`
- [x] 4.2 В браузере: склеить с «Оставить» и с «Скрыть» (часть строк → донор)
