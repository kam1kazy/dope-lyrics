## 1. Схема и миграция

- [x] 1.1 Проверить текущую базу на дубли по `(userId, source, lyric_id)` при `lyric_id > 0` — запросом, до правок схемы; при находках решить, что с ними делать
- [x] 1.2 `server/prisma/schema.prisma`: `Users` — `telegramId BigInt? @unique`, `role` (enum `UserRole`: `OWNER` | `ADMIN` | `USER`, дефолт `USER`), `email` и `password` в необязательные
- [x] 1.3 `server/prisma/schema.prisma`: `LyricCollage` и `CarouselHistory` — `userId Int?` со связью на `Users` и индексом `(userId, createdAt)`
- [x] 1.4 `server/prisma/schema.prisma`: новая модель `Session` (токен, владелец, срок, отзыв) и `ChannelBinding` (Telegram id канала `@unique`, владелец, дата)
- [x] 1.5 Миграция: бэкфилл `LyricCollage.userId` и `CarouselHistory.userId` на пользователя 1, ему же `telegramId` из `BOT_ADMIN_ID` и роль `OWNER`
- [x] 1.6 Миграция: `userId` в `NOT NULL` у `Lyrics`, `LyricCollage`, `CarouselHistory`
- [x] 1.7 Миграция: снять `@@index([source, lyric_id])`, поставить частичный уникальный `(userId, source, lyric_id)` при `lyric_id > 0`
- [x] 1.8 `bun prisma generate` из `server/`, прогнать миграцию на локальной `dope-lyrics-db` (5433), убедиться, что каталог на месте

## 2. Права и роли

- [x] 2.1 `server/src/modules/auth/permissions.ts` (новый): тип права, матрица `OWNER` / `ADMIN` / `USER`, `can(user, permission)`; неизвестное право → `false`
- [x] 2.2 Тесты `permissions.ts`: `USER` без `db:*` и `users:*`; `ADMIN` с `users:list` без `db:clear` / `db:seed` / `db:parse` / `users:role`; `OWNER` со всеми правами
- [x] 2.3 `server/src/mtcute/guards/assert-admin.ts` (или переименовать): проверка через `can(..., 'db:…')`, не сравнение с `BOT_ADMIN_ID`; `/bd` только у `OWNER`
- [x] 2.4 Точки управления базой и будущие admin-операции спрашивают право через `can()`, не `role === '…'`

## 3. Учётки и сессии на сервере

- [x] 3.1 `server/src/config/telegram-login.ts`: проверка подписи Telegram Login Widget (ключ `SHA256(botToken)`) + тест рядом, отдельно от `telegram-webapp.ts`
- [x] 3.2 `server/src/modules/users/users.service.ts`: `findOrCreateByTelegramId` с ролью `OWNER` для `BOT_ADMIN_ID`, иначе `USER`; убрать сидового `owner` с открытым паролем из нового контура
- [x] 3.3 `server/src/modules/auth/session.service.ts` (новый): выдача, продление с ротацией, отзыв, чистка просроченных
- [x] 3.4 `server/src/modules/auth/auth.routes.ts` (новый, Elysia): вход из Mini App по `initData`, вход по Login Widget, тихое продление, выход; httpOnly cookie, `SameSite`, `Secure` в production
- [x] 3.5 `server/src/config/security.ts`: вместо сверки с `telegramAdminId` — пользователь из cookie-сессии **или** из `initData`; роль для `can()` — свежая из БД, не слепок в cookie; нет пользователя → 401; `/auth/*` не под этой проверкой
- [x] 3.6 `server/src/app/server.ts`: `Access-Control-Allow-Credentials` и CORS под cookie; `server/src/config/env.ts` — переменные срока сессии
- [x] 3.7 Rate limit на вход отдельно от общего лимита (`security.ts`)

## 4. Владелец в данных

- [x] 4.1 `server/src/graphql/context.ts`: контекст несёт пользователя (id, роль) рядом с `prisma`
- [x] 4.2 `server/src/modules/lyrics/lyrics-list-filters.ts`: владелец в `buildLyricsWhere` и парных сборщиках `where` — из контекста, не из аргументов
- [x] 4.3 `server/src/modules/lyrics/lyrics.service.ts`: владелец во всех выборках (список, карусель, очередь, полки, поиск) и при создании записи вместо `owner.id`
- [x] 4.4 `server/src/modules/lyrics/lyrics.service.ts`: мутации по записи — `where: { id, userId }`, ноль строк → ошибка «не найдено» по-русски
- [x] 4.5 Разрез, нарезка, склейка (`lyric-glue.ts`, `track-assemble.ts`, `persist/create-lyric-data.ts`): копирование владельца донора
- [x] 4.6 `server/src/modules/lyrics/catalog-stats.ts` и `carousel-history.ts`: счётчики и история только по своему корпусу
- [x] 4.7 `server/src/graphql/typeDefs.ts` и `resolvers.ts`: убедиться, что владелец нигде не приходит аргументом от клиента; поправить контракт, если приходит
- [x] 4.8 `server/prisma/script/seed.ts`: посев привязан к владельцу-`OWNER`, не к безымянному `owner`

## 5. Бот: канал, импорт, админ

- [x] 5.1 `server/src/mtcute/guards/assert-user.ts` (новый): найти учётку по Telegram id отправителя, иначе ответ по-русски «сначала откройте приложение»
- [x] 5.2 `server/src/mtcute/commands/channel.ts` (новый): команда привязки и отвязки канала с проверкой, что отправитель — владелец или админ канала; право `channel:bind`
- [x] 5.3 `server/src/mtcute/index.ts`: обработчик новых постов привязанного канала → запись в каталог владельца привязки, источник `TELEGRAM`; предупреждение про историю при привязке
- [x] 5.4 `server/src/mtcute/commands/apple-notes.ts`: состояние ожиданий (путь, окно zip) по Telegram id отправителя, не под одного админа; право `notes:import`
- [x] 5.5 `server/src/modules/lyrics/import/apple-notes-import.ts`: импорт принимает владельца вместо `owner.id`; дедуп в пределах его каталога
- [x] 5.6 `server/prisma/script/import-apple-notes.ts` (CLI): владелец параметром, по умолчанию `OWNER`
- [x] 5.7 Команда привязки канала в `setMyCommands`

## 6. Клиент

- [x] 6.1 `client/src/shared/api/apollo-client.ts`: `credentials: 'include'` рядом с `X-Telegram-Init-Data`
- [x] 6.2 `client/src/app/ui/telegram-gate.tsx`: вместо «Откройте каталог из Telegram» — проверка сессии; в Mini App вход по `initData` молча, вне Telegram — экран входа
- [x] 6.3 `client/src/app/ui/login-screen.tsx` (новый, shadcn): вход через Telegram Login Widget, ошибки по-русски
- [x] 6.4 Выход из аккаунта в меню каталога (`client/src/widgets/catalog-menu/ui/catalog-menu.tsx`)
- [x] 6.5 `client/public/favicon/site.webmanifest` и `client/src/app/layout.tsx`: manifest подключён, каталог ставится на домашний экран как отдельное приложение
- [x] 6.6 Без экранов управления ролями и правами

## 7. Проверка изоляции и ролей

- [x] 7.1 Тесты сервера: автор B не видит фразы автора A в списке, карусели, сводке, истории и склейках
- [x] 7.2 Тесты сервера: мутация автора B над записью автора A отклонена, данные не изменились
- [x] 7.3 Тесты сервера: `ADMIN` не видит чужой каталог; `USER` не выполняет `db:clear`; `ADMIN` не выполняет `db:seed` / `db:parse` / `db:clear`
- [x] 7.4 Тесты сервера: посты с одинаковым `message_id` в разных каналах не схлопываются; повтор одного поста не дублируется
- [x] 7.5 Тесты сервера: импорт Apple Notes с одинаковыми номерами заметок у двух авторов не отбрасывается как дубликат
- [x] 7.6 Тесты подписи: `initData` и Login Widget — верная проходит, подделанная и просроченная отклоняются
- [ ] 7.7 Ручная проверка на двух живых Telegram-аккаунтах: вход, привязка канала, импорт заметок, каталоги не пересекаются
- [x] 7.8 `bun run fix` в `client/` и `server/` (typecheck + eslint/prettier по затронутым файлам; полный `fix` ещё ругается на старые `== null` вне этого среза)

## 8. Документация

- [x] 8.1 ADR: вход через учётку и сессию, отменяет `docs/decisions/0007-mini-app-initdata.md`; роли и матрица прав — кратко
- [x] 8.2 `docs/roadmap.md` (дорожка F) и `docs/architecture.md`: многопользовательский режим вместо «когда появится вход»
- [x] 8.3 `docs/versions.md` и `docs/tasks/current_task.md`: новая версия и текущее состояние
- [x] 8.4 FAQ бота: что бот не читает историю канала, попадёт только новое
