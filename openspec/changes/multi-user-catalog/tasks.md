## 1. Схема и миграция

- [ ] 1.1 Проверить текущую базу на дубли по `(userId, source, lyric_id)` при `lyric_id > 0` — запросом, до правок схемы; при находках решить, что с ними делать
- [ ] 1.2 `server/prisma/schema.prisma`: `Users` — `telegramId BigInt? @unique`, `role` (enum `UserRole`: `ADMIN` | `USER`, дефолт `USER`), `email` и `password` в необязательные
- [ ] 1.3 `server/prisma/schema.prisma`: `LyricCollage` и `CarouselHistory` — `userId Int?` со связью на `Users` и индексом `(userId, createdAt)`
- [ ] 1.4 `server/prisma/schema.prisma`: новая модель `Session` (токен, владелец, срок, отзыв) и `ChannelBinding` (Telegram id канала `@unique`, владелец, дата)
- [ ] 1.5 Миграция: бэкфилл `LyricCollage.userId` и `CarouselHistory.userId` на пользователя 1, ему же `telegramId` из `BOT_ADMIN_ID` и роль `ADMIN`
- [ ] 1.6 Миграция: `userId` в `NOT NULL` у `Lyrics`, `LyricCollage`, `CarouselHistory`
- [ ] 1.7 Миграция: снять `@@index([source, lyric_id])`, поставить частичный уникальный `(userId, source, lyric_id)` при `lyric_id > 0`
- [ ] 1.8 `bun prisma generate` из `server/`, прогнать миграцию на локальной `dope-lyrics-db` (5433), убедиться, что каталог на месте

## 2. Учётки и сессии на сервере

- [ ] 2.1 `server/src/config/telegram-login.ts`: проверка подписи Telegram Login Widget (ключ `SHA256(botToken)`) + тест рядом, отдельно от `telegram-webapp.ts`
- [ ] 2.2 `server/src/modules/users/users.service.ts`: `findOrCreateByTelegramId` с ролью `ADMIN` для `BOT_ADMIN_ID`; убрать сидового `owner` с открытым паролем из нового контура
- [ ] 2.3 `server/src/modules/auth/session.service.ts` (новый): выдача, продление с ротацией, отзыв, чистка просроченных
- [ ] 2.4 `server/src/modules/auth/auth.routes.ts` (новый, Elysia): вход из Mini App по `initData`, вход по Login Widget, тихое продление, выход; httpOnly cookie, `SameSite`, `Secure` в production
- [ ] 2.5 `server/src/config/security.ts`: вместо сверки с `telegramAdminId` — пользователь из cookie-сессии **или** из `initData`; нет пользователя → 401; `/auth/*` не под этой проверкой
- [ ] 2.6 `server/src/app/server.ts`: `Access-Control-Allow-Credentials` и CORS под cookie; `server/src/config/env.ts` — переменные срока сессии
- [ ] 2.7 Rate limit на вход отдельно от общего лимита (`security.ts`)

## 3. Владелец в данных

- [ ] 3.1 `server/src/graphql/context.ts`: контекст несёт пользователя (id, роль) рядом с `prisma`
- [ ] 3.2 `server/src/modules/lyrics/lyrics-list-filters.ts`: владелец в `buildLyricsWhere` и парных сборщиках `where` — из контекста, не из аргументов
- [ ] 3.3 `server/src/modules/lyrics/lyrics.service.ts`: владелец во всех выборках (список, карусель, очередь, полки, поиск) и при создании записи вместо `owner.id`
- [ ] 3.4 `server/src/modules/lyrics/lyrics.service.ts`: мутации по записи — `where: { id, userId }`, ноль строк → ошибка «не найдено» по-русски
- [ ] 3.5 Разрез, нарезка, склейка (`lyric-glue.ts`, `track-assemble.ts`, `persist/create-lyric-data.ts`): копирование владельца донора
- [ ] 3.6 `server/src/modules/lyrics/catalog-stats.ts` и `carousel-history.ts`: счётчики и история только по своему корпусу
- [ ] 3.7 `server/src/graphql/typeDefs.ts` и `resolvers.ts`: убедиться, что владелец нигде не приходит аргументом от клиента; поправить контракт, если приходит
- [ ] 3.8 `server/prisma/script/seed.ts`: посев привязан к владельцу-админу, не к безымянному `owner`

## 4. Бот: канал, импорт, админ

- [ ] 4.1 `server/src/mtcute/guards/assert-admin.ts`: разделить «админ по роли» и «любой вошедший пользователь»; `/bd` остаётся админским
- [ ] 4.2 `server/src/mtcute/guards/assert-user.ts` (новый): найти учётку по Telegram id отправителя, иначе ответ по-русски «сначала откройте приложение»
- [ ] 4.3 `server/src/mtcute/commands/channel.ts` (новый): команда привязки и отвязки канала с проверкой, что отправитель — владелец или админ канала
- [ ] 4.4 `server/src/mtcute/index.ts`: обработчик новых постов привязанного канала → запись в каталог владельца привязки, источник `TELEGRAM`; предупреждение про историю при привязке
- [ ] 4.5 `server/src/mtcute/commands/apple-notes.ts`: состояние ожиданий (путь, окно zip) по Telegram id отправителя, не под одного админа
- [ ] 4.6 `server/src/modules/lyrics/import/apple-notes-import.ts`: импорт принимает владельца вместо `owner.id`; дедуп в пределах его каталога
- [ ] 4.7 `server/prisma/script/import-apple-notes.ts` (CLI): владелец параметром, по умолчанию админ
- [ ] 4.8 Команда привязки канала в `setMyCommands`

## 5. Клиент

- [ ] 5.1 `client/src/shared/api/apollo-client.ts`: `credentials: 'include'` рядом с `X-Telegram-Init-Data`
- [ ] 5.2 `client/src/app/ui/telegram-gate.tsx`: вместо «Откройте каталог из Telegram» — проверка сессии; в Mini App вход по `initData` молча, вне Telegram — экран входа
- [ ] 5.3 `client/src/app/ui/login-screen.tsx` (новый, shadcn): вход через Telegram Login Widget, ошибки по-русски
- [ ] 5.4 Выход из аккаунта в меню каталога (`client/src/widgets/catalog-menu/ui/catalog-menu.tsx`)
- [ ] 5.5 `client/public/favicon/site.webmanifest` и `client/src/app/layout.tsx`: manifest подключён, каталог ставится на домашний экран как отдельное приложение

## 6. Проверка изоляции

- [ ] 6.1 Тесты сервера: автор B не видит фразы автора A в списке, карусели, сводке, истории и склейках
- [ ] 6.2 Тесты сервера: мутация автора B над записью автора A отклонена, данные не изменились
- [ ] 6.3 Тесты сервера: посты с одинаковым `message_id` в разных каналах не схлопываются; повтор одного поста не дублируется
- [ ] 6.4 Тесты сервера: импорт Apple Notes с одинаковыми номерами заметок у двух авторов не отбрасывается как дубликат
- [ ] 6.5 Тесты подписи: `initData` и Login Widget — верная проходит, подделанная и просроченная отклоняются
- [ ] 6.6 Ручная проверка на двух живых Telegram-аккаунтах: вход, привязка канала, импорт заметок, каталоги не пересекаются
- [ ] 6.7 `bun run fix` в `client/` и `server/`

## 7. Документация

- [ ] 7.1 ADR: вход через учётку и сессию, отменяет `docs/decisions/0007-mini-app-initdata.md`
- [ ] 7.2 `docs/roadmap.md` (дорожка F) и `docs/architecture.md`: многопользовательский режим вместо «когда появится вход»
- [ ] 7.3 `docs/versions.md` и `docs/tasks/current_task.md`: новая версия и текущее состояние
- [ ] 7.4 FAQ бота: что бот не читает историю канала, попадёт только новое
