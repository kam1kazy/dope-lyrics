## 1. Prisma: поля профиля

- [x] 1.1 Добавить на `Lyrics` в `server/prisma/schema.prisma` nullable `mood`, `delivery`, `songRole`, `readiness` (`String?`)
- [x] 1.2 Сделать и закоммитить миграцию из `server/` (`bunx prisma migrate dev`); `bun prisma generate`

## 2. Словари и сервис (MVP 1)

- [x] 2.1 Завести словари и проверку значений в `server/src/modules/lyrics/lyric-facets.ts` (ключи API + подписи не обязательны на сервере)
- [x] 2.2 `updateProfile` в `server/src/modules/lyrics/lyrics.service.ts`: опциональные поля, `null` снимает грань, неизвестное значение — ошибка по-русски
- [x] 2.3 Расширить `LyricsListOptions` и `buildLyricsWhere` в `server/src/modules/lyrics/lyrics-list-filters.ts` (И по заданным граням)
- [x] 2.4 Убедиться, что повторная загрузка не затирает профиль; mood/delivery/songRole при create не пишутся
- [x] 2.5 Добавить `TEXT` в словарь готовности (server + client + GraphQL enum); порядок: LINE → FRAGMENT → BLOCK → TEXT → READY
- [x] 2.6 `readinessFromLineCount` в `lyric-facets.ts`; писать `readiness` при create в `create-lyric-data.ts`
- [x] 2.7 Data-миграция: заполнить `readiness IS NULL` по `Message.paragraph_count` (готово не ставить)

## 3. GraphQL: профиль и фильтр

- [x] 3.1 Enums и поля на `Lyric` в `server/src/graphql/typeDefs.ts`; аргументы `lyrics(...)`; мутация `updateLyricProfile`
- [x] 3.2 Резолверы в `server/src/graphql/resolvers.ts`; типы в `server/src/modules/lyrics/lyrics.types.ts`

## 4. Клиент: карточка и фильтры (MVP 1)

- [x] 4.1 Словари и поля в `client/src/entities/lyric` (`model/types.ts`, `api/queries.ts`, `lib/lyrics-query-variables.ts`, кэш по аналогии с `lib/update-lyrics-cache.ts`)
- [x] 4.2 Табы «Текст» / «Профиль» в `client/src/features/message-desk/ui/message-desk-dialog.tsx`; сохранение граней; полки в футере; ошибки по-русски
- [x] 4.3 Чипы граней в `client/src/features/filter-panel/ui/filter-panel.tsx` и прокидка переменных в `client/src/widgets/lyric-list/ui/lyric-list.tsx`; empty state, если фильтр ничего не нашёл
- [x] 4.4 Не сломать избранное/демки: те же переменные где нужно в `catalog-favorites-panel.tsx` / `catalog-demos-panel.tsx` (грани не обязательны в полках)

## 5. Сводка каталога (MVP 2)

- [x] 5.1 `catalogStats` в GraphQL (`typeDefs.ts`, `resolvers.ts`) и подсчёт в `lyrics.service.ts`: N; эталон / избранное / скрыто / цензура; покрытие (≥1 роль); по каждой роли — число фраз и mood/delivery внутри роли; готовность по фразам; ряд «без роли». Не GROUP BY глобальных `mood`/`delivery` как главные цифры
- [x] 5.2 Query и типы на клиенте в `client/src/entities/lyric`
- [x] 5.3 Живой пункт «Сводка» и панель в `client/src/widgets/catalog-menu/ui/catalog-menu.tsx` (не заглушка; без ИИ и без кнопки «собрать трек»; подпись что считаются куски)
- [x] 5.4 На карточке не добавлять счётчик переключений эталона — только текущие флаги полок (включая цензуру)

## 6. Проверка

- [x] 6.1 `bun run typecheck` в `server/` и `client/` после правок (не весь `fix` пакетов без нужды)
- [x] 6.2 В браузере: сохранить/снять грань, фильтр карусели, seed не затирает, сводка в меню, пустой каталог не падает
