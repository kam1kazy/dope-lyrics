## 0. Подготовка

- [x] 0.1 Ветка `feat/profile-page` от актуального `main`; перенести туда фикс адреса ingest из рабочей копии `fix/ingest-between-containers` (`INGEST_HOST` в `env.ts`, `ingest-http.ts`, `mtcute/index.ts`, `environment` в `docker-compose.prod.yml`)
- [x] 0.2 Прод, только чтение (`ssh marzban`, `psql` внутри `dope-lyrics-db` через переменные контейнера): формат `Chat.id` у записей владельца vs `ChannelBinding.channelId`; число `TELEGRAM`-записей без `Chat`. По итогу уточнить правило «уже загружено» для `'main'` в design п. 5

## 1. Дедупликация по чату

- [x] 1.0 Схема Prisma: `Lyrics.chatId BigInt?` + индекс `(userId, source, chatId, lyric_id)`; миграция `20261109124251_lyrics_chat_id` — бэкфилл из `Chat.id`, удаление частичного уникального `Lyrics_userId_source_lyric_id_key` (он не пускал одинаковые номера из разных чатов и копии при разделении фразы); `chatId` пишут `createLyricData`, `splitLyric`, `sliceLyric`
- [x] 1.1 `server/src/modules/lyrics/lyrics.service.ts`: `loadNewRecords` — известные пары `(chat.id, lyric_id)` вместо `lyric_id`; лог пропусков как был
- [x] 1.2 `lyrics.service.ts`: `listLyricIds(userId)` → `listKnownMessageIds(userId, chatId)` — только `TELEGRAM` и нужный чат
- [x] 1.3 `server/src/modules/lyrics/parse/fetch-new-history.ts`: дата смещения следующей страницы в секундах
- [x] 1.4 `server/src/modules/lyrics/load-new-records.test.ts`: заметка Apple Notes с тем же номером не считается известной; одинаковый id в двух чатах не дубль; повтор не плодит запись; разделение фразы из Telegram не падает

## 2. Ingest в боте

- [x] 2.1 `server/src/config/env.ts`: `INGEST_TOKEN` (опционально) в схемах бота и backend
- [x] 2.2 `server/src/mtcute/ingest-http.ts`: проверка `X-Ingest-Token`; отказ стартовать на не-loopback без токена; живой приём постов (`ingest-channel-post.ts`) под тем же локом
- [x] 2.3 `ingest-http.ts`: `/sources {userId}` — источники пользователя (`ChannelBinding` + `'main'` для `OWNER`), резолв пира `tgAdmin` (id → username через `tg.getChat`), счётчик по каждому, состояния `READY` / `UNAVAILABLE` / `ERROR`
- [x] 2.4 `ingest-http.ts`: `/apply {userId, key}` — проверка, что источник принадлежит пользователю (иначе 403), докачка в каталог `userId`; старые `/preview` и `/apply` без тела удалить
- [x] 2.5 `server/src/mtcute/index.ts`: передать в `startIngestHttp` бот-клиент (`tg`) для резолва username и `BOT_CHANNEL_ID` для `'main'`
- [x] 2.6 `server/src/mtcute/commands/channel.ts`: текст `HISTORY_WARNING` — пропущенное можно докачать в профиле, если канал открыт для чтения

## 3. Контракт GraphQL

- [x] 3.1 `server/src/graphql/typeDefs.ts`: `Profile`, `IngestSource` (+ enum `IngestSourceKind`, `IngestSourceState`), `IngestApplyResult`, `Invite`, `CreatedInvite`; `Query.profile`, `ingestSources`, `myInvites`; `Mutation.ingestSource`, `createInvite`, `revokeInvite`. Удалить `lyricIngestPreview`, `ingestPendingLyrics`, `LyricIngestPreview`, `LyricIngestResult`
- [x] 3.2 `server/src/graphql/ingest-client.ts`: `fetchIngestSources(userId)`, `applyIngestSource(userId, key)` с токеном, таймаут 5 мин, разбор ответа через `unknown`; бот недоступен → ошибка «Бот недоступен»
- [x] 3.3 `server/src/graphql/resolvers.ts`: резолверы из 3.1; приглашения — `can(user, 'users:invite')`, иначе «Нет доступа»; `revokeInvite` через `invitesService.revoke(id, user.id)`
- [x] 3.4 Тесты резолверов: `USER` не создаёт/не видит/не отзывает приглашения; чужое приглашение не отзывается; `profile` без сессии — 401

## 4. Клиент

- [x] 4.1 `client/src/entities/` (или `features/user-profile/api`): запросы и мутации 3.1, типы без `any`
- [x] 4.2 `client/src/features/user-profile/` (новый): панель с блоками «Учётка» (имя, роль по-русски), «Подкачка» (список, состояния, «Докачать» с inline-подтверждением, «Проверяю…», подсказка про `/channel`), «Приглашения» (создать → ссылка + «Скопировать» + срок, список, «Отозвать»; скрыт для `USER`)
- [x] 4.3 Ссылка приглашения из `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`; без имени бота — код и подсказка `/start inv_<код>`
- [x] 4.4 После докачки — refetch источников и активных списков фраз
- [x] 4.5 `client/src/widgets/catalog-menu/ui/catalog-menu.tsx` + `catalog-menu-context`: секция `profile` («Профиль», `UserRound`) первой в меню
- [x] 4.6 Удалить `client/src/features/catalog-ingest/`, `CatalogIngest` и проп `checkIngest` из `filter-panel.tsx` и `control-bar.tsx`; `LYRIC_INGEST_PREVIEW` / `INGEST_PENDING_LYRICS` из `entities/lyric`

## 5. Прод-конфиг

- [x] 5.1 `docker-compose.prod.yml`: `INGEST_URL` у backend и `INGEST_HOST` у бота (из 0.1); `INGEST_TOKEN` берётся из `server/.env` обоими
- [x] 5.2 `server/.env.example` — строки `INGEST_HOST`, `INGEST_TOKEN` без значений

## 6. Проверка

- [x] 6.1 `bun run fix` в `server/` и `client/` зелёный (errors и warnings), тесты сервера зелёные
- [x] 6.2 Локально (бот не запускался — общий бот-токен с продом): ingest-сервер отдельно — 401 без токена, отказ старта на `0.0.0.0` без токена, `/sources` владельца → «Основной чат», чужой ключ `/apply` → 403; GraphQL `profile` / `myInvites` / `createInvite` / `revokeInvite` работают, `ingestSources` без бота → «Бот недоступен»; клиент собирается. Счётчик и докачка с живым сеансом и UI в браузере — на стенде (6.3)
- [ ] 6.3 Стенд (после того как автор впишет `INGEST_TOKEN`): из backend доступен бот; профиль владельца — счётчик основного чата и докачка; приглашение из профиля открывается в боте и заводит `USER`

## 7. Документация

- [x] 7.1 `docs/status.md`: строки «Регистрация» и «Карусель/Сервер» — профиль, подкачка по источникам
- [ ] 7.2 При архиве: `docs/tasks/current_task.md`, `docs/versions.md`, MINOR-ап
