## Context

- Историю Telegram читает только user-сеанс владельца (`tgAdmin`) в процессе бота (`server/src/mtcute/index.ts`). Бот-аккаунт (`tg`) историю читать не может, зато получает новые посты привязанных каналов (`ingest-channel-post.ts`).
- Backend (GraphQL) и бот — разные контейнеры прода. Backend зовёт бота по HTTP (`server/src/graphql/ingest-client.ts` → `server/src/mtcute/ingest-http.ts`). Бот слушал `127.0.0.1` — из backend недостижим. Фикс адреса уже лежит в рабочей копии ветки `fix/ingest-between-containers` (`INGEST_HOST`, `environment` в `docker-compose.prod.yml`) — входит в этот change.
- Ingest сейчас жёстко: чат `BOT_CHANNEL_ID`, каталог `usersService.getOwner()`, «уже загружено» = все `lyric_id` владельца, включая Apple Notes и склейки (`lyric_id = 0`).
- `lyricsService.loadNewRecords` дедупит по `userId + lyric_id` (`TELEGRAM`), без чата — расходится со спекой `telegram-channel-ingest`.
- Привязки — `ChannelBinding` (`channelId BigInt @unique`, `userId`, `title`). Чат записи — `Chat.id` (BigInt) на `Lyrics`.
- Приглашения — `invitesService` (`create`, `listActive`, `revoke`), бот строит ссылку `t.me/<бот>?start=inv_<код>` через `tg.getMe()`. У клиента имя бота есть в `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` (вшивается при сборке).
- Меню — `client/src/widgets/catalog-menu/ui/catalog-menu.tsx` (секции `CatalogMenuSection`, панели фич). Кнопка подкачки — `client/src/features/catalog-ingest`, встроена в `filter-panel`.

## Goals / Non-Goals

**Goals:** один контракт «источники пользователя → счётчик → докачка в его каталог»; рабочая связь backend → бот на проде; веб-приглашения поверх существующего `invitesService` без новой схемы.

**Non-Goals:** новые таблицы Prisma (новая колонка — да, см. п. 5); очередь задач / фоновые воркеры; второй user-сеанс Telegram; отдельный роут Next под профиль.

## Decisions

### 1. Telegram: только user-сеанс владельца, через бота

GraphQL не трогает Telegram напрямую. Backend → внутренний HTTP бота → `tgAdmin.getHistory`. Mini App ни при чём. Альтернатива — держать `tgAdmin` в backend — даёт второй клиент на одну сессию `bot-data/sessionAdmin`, mtcute этого не любит.

### 2. Контракт бот ↔ backend

`POST` JSON, заголовок `X-Ingest-Token`:

- `/sources` `{ userId }` → `{ sources: [{ key, title, kind: 'MAIN' | 'CHANNEL', state: 'READY' | 'UNAVAILABLE' | 'ERROR', pendingCount }] }`
- `/apply` `{ userId, key }` → `{ ok, addedCount }`

`key` — `'main'` или `channelId` строкой. Бот сам решает, какие источники принадлежат `userId`: привязки из `ChannelBinding` + `'main'`, если роль `OWNER`. Чужой `key` → 403. Backend передаёт только `user.id` из сессии, роль бот берёт из базы — клиенту нечего подделать.

Все вызовы под существующим `withIngestLock` — докачки идут по очереди.

Старые `/preview` и `/apply` без тела удаляются вместе с GraphQL `lyricIngestPreview` / `ingestPendingLyrics`.

### 3. Защита и сеть

Бот слушает `INGEST_HOST` (дефолт `127.0.0.1`, на проде `0.0.0.0` в compose). Новый `INGEST_TOKEN` в `server/.env` — общий для backend и бота. Бот отвечает 401 без верного токена; если `INGEST_HOST` не loopback, а токена нет — ingest не стартует и пишет ошибку в лог. Локально без токена работает на `127.0.0.1`. Альтернатива — отдельная docker-сеть только для backend+бот — тоже хорошо, но токен нужен всё равно (сеть `legoblokk` общая с основным сайтом), и правка compose больше.

### 4. Доступ к истории канала

Перед чтением бот резолвит пир для `tgAdmin`: сначала по id (работает, если аккаунт состоит в канале или уже видел его), затем — username канала через бот-аккаунт (`tg.getChat`) и резолв `tgAdmin` по username (публичный канал). Не вышло → `UNAVAILABLE`. Аккаунт в каналы не вступает.

### 5. «Уже загружено» — по чату

Известные id источника = `lyric_id` записей пользователя с `source = TELEGRAM` и `chat.id = <id чата источника>`. Прод 9.11.2026: все `TELEGRAM`-записи владельца (2492) имеют `Chat` с marked id канала (`-100…`), записей без `Chat` нет — отдельного правила для наследия не нужно. Id чата для поиска известных берём из резолва пира `tgAdmin` (`getChat`), а не из env — формат гарантированно совпадает с `msg.chat.id`, которым пишутся `Chat.id` и `ChannelBinding.channelId`.

`loadNewRecords` дедупит по паре `(chatId, lyric_id)` вместо одного `lyric_id`. Это чинит и живой приём постов (`ingestChannelPost`).

Схема: на `Lyrics` колонка `chatId BigInt?` (копия `Chat.id`, бэкфилл в миграции) и обычный индекс `(userId, source, chatId, lyric_id)`. Частичный уникальный индекс `(userId, source, lyric_id) WHERE lyric_id > 0` из `multi_user_catalog` удаляется: он не пускал одинаковые номера из разных чатов, а заодно ронял `splitLyric` / `sliceLyric` (они создают копию с тем же `lyric_id`). Уникальный индекс с `chatId` не годится по той же причине — копии разделения. Дубликаты отсекает `loadNewRecords`; гонку закрывает общий лок ingest, под который встаёт и живой приём постов.

В `fetchNewHistory` — дата смещения следующей страницы в секундах (сейчас `getTime()` — миллисекунды).

### 6. Таймауты

Первый просмотр канала без записей в каталоге проходит всю историю (100 сообщений/с с паузой). `ingest-client` таймаут 120 с → 5 мин для обоих вызовов. Клиент запрашивает источники при открытии профиля (`network-only`) и показывает «Проверяю…». Лимит на число сообщений не вводим: обрыв на середине сломал бы правило «стоп на первом известном» (старые остались бы недокачанными навсегда).

### 7. GraphQL

```graphql
type Profile { id: Int!, username: String!, role: UserRole! }
type IngestSource { key: String!, title: String!, kind: IngestSourceKind!, state: IngestSourceState!, pendingCount: Int! }
type IngestApplyResult { ok: Boolean!, addedCount: Int! }
type Invite { id: Int!, createdAt: String!, expiresAt: String! }
type CreatedInvite { code: String!, expiresAt: String! }

Query:    profile: Profile!   ingestSources: [IngestSource!]!   myInvites: [Invite!]!
Mutation: ingestSource(key: String!): IngestApplyResult!   createInvite: CreatedInvite!   revokeInvite(id: Int!): Boolean!
```

Все — `requireUser`. Приглашения — дополнительно `can(user, 'users:invite')`, иначе ошибка «Нет доступа» (как `users` в `resolvers.ts`). `revokeInvite` — через `invitesService.revoke(id, user.id)`: чужое → `false`, клиент показывает «Не удалось отозвать». Бот недоступен → `ingestSources` отдаёт ошибку GraphQL «Бот недоступен» (а не пустой список — иначе не отличить от «нет источников»). Клиент рисует «Не удалось проверить», остальной профиль открывается: данные профиля и приглашения — отдельные запросы.

Ссылку приглашения строит клиент: `https://t.me/${NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=inv_${code}` — тот же формат, что в `invite.ts`. Имя бота пустое → показываем код и подсказку отправить `/start inv_<код>` боту.

### 8. Клиент

- Новая секция меню `profile` («Профиль», иконка `UserRound`) первой в `MENU_ITEMS`; панель `client/src/features/user-profile` с тремя блоками: учётка, подкачка, приглашения (последний — только при `role !== 'USER'`; права проверяет сервер).
- Подтверждение докачки — тот же паттерн, что в `CatalogIngest` (inline «Добавить N сообщений из …?»). После успеха — `refetch` источников и сброс кэша `lyrics` (`apolloClient.refetchQueries` активных списков), чтобы новые фразы появились в карусели.
- `client/src/features/catalog-ingest` удаляется, `CatalogIngest` уходит из `filter-panel` (проп `checkIngest` тоже).
- Роль — подписи «Владелец» / «Админ» / «Пользователь».

## Risks / Trade-offs

- [Первый просмотр большого канала долгий; закрыл профиль — запрос дорабатывает впустую] → таймаут 5 мин, лок, лог `Новых сообщений: N`; при жалобах — кэш счётчика на минуту.
- [FLOOD_WAIT на сеансе владельца от чужих докачек] → лок не даёт параллели; `fetchNewHistory` уже ждёт `seconds`.
- [Сеанс владельца читает каналы друзей] → только каналы, которые друг сам привязал и доказал права админа; ничего не вступает и не пишет.
- [Наследные записи без `Chat` или другой формат id] → проверка запросом на проде до кода; при расхождении — правило в п. 5 расширяется, спека не меняется.
- [`INGEST_TOKEN` забыли вписать] → бот не поднимает ingest на `0.0.0.0` и пишет причину; профиль показывает «Не удалось проверить», каталог работает.

## Migration Plan

1. Архив `invite-only-signup` (после проверки на стенде 7.2).
2. Автор вписывает `INGEST_TOKEN` в `server/.env` на `marzban` (значение генерирует сам, `openssl rand -hex 32`).
3. Бэкап базы, `git pull`, сборка `--profile app`, пересоздание `telegram-bot` (порядок — как в обычном деплое).
4. Проверка: профиль владельца показывает основной чат со счётчиком; докачка добавляет фразы.

Откат: предыдущий образ backend + бот. Колонка `chatId` и обычный индекс старому коду не мешают; уникальный индекс назад не возвращаем (с ним снова падает разделение фраз). Данные докачки — обычные записи `TELEGRAM`.
