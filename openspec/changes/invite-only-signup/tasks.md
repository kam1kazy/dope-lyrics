## 1. Схема и миграция

- [ ] 1.1 `server/prisma/schema.prisma`: модель `Invite` (`codeHash @unique`, `createdById`, `createdAt`, `expiresAt`, `usedById?`, `usedAt?`, `revokedAt?`), связи с `Users`, индекс `(createdById, createdAt)`
- [ ] 1.2 Миграция: таблица `Invite` и `setval` счётчика `Users.id` на `MAX(id)`
- [ ] 1.3 `bun prisma generate`, прогнать миграцию на локальной `dope-lyrics-db` (5433)

## 2. Права

- [ ] 2.1 `server/src/modules/auth/permissions.ts`: право `users:invite` у `ADMIN` и `OWNER`
- [ ] 2.2 `server/src/modules/auth/permissions.test.ts`: `USER` без `users:invite`, `ADMIN` и `OWNER` с ним

## 3. Приглашения на сервере

- [ ] 3.1 `server/src/modules/users/invites.service.ts` (новый): создание (код base64url, sha256 в базе, срок 7 дней), список действующих автора, отзыв своим автором или `OWNER`
- [ ] 3.2 `invites.service.ts`: активация одной транзакцией — условный `updateMany` по действующему коду, заведение учётки `USER`, отметка `usedById`; аккаунт с учёткой → «доступ уже есть», код не тратится
- [ ] 3.3 `server/src/modules/users/invites.service.test.ts`: одноразовость, просрочка, отзыв, гонка двух аккаунтов на один код, повторное открытие владельцем учётки

## 4. Вход без заведения учётки

- [ ] 4.1 `server/src/modules/users/users.service.ts`: `findOrCreateByTelegramId` → `findForLogin` (создаёт только `OWNER` из `BOT_ADMIN_ID`, иначе `null`)
- [ ] 4.2 `server/src/modules/auth/auth.routes.ts`: оба входа — незнакомый аккаунт → 403 «Доступ по приглашению», сессия не выдаётся
- [ ] 4.3 `server/src/modules/auth/resolve-auth-user.ts`: незнакомый `initData` → `null` (GraphQL 401), учётка не заводится
- [ ] 4.4 `server/src/modules/auth/auth.routes.test.ts`: вход незнакомого → 403 и ни учётки, ни сессии; вход после активации → 200

## 5. Бот

- [ ] 5.1 `server/src/mtcute/commands/invite.ts` (новый): `/invite` по `users:invite` — ссылка `t.me/<бот>?start=inv_<код>` и срок; имя бота из `tg.getMe()`
- [ ] 5.2 `invite.ts`: `/invites` — список действующих с кнопкой «Отозвать» (callback с id, проверка автора)
- [ ] 5.3 `server/src/mtcute/index.ts`: `filters.deeplink(/^inv_/)` → активация, ответ по-русски с `BotKeyboard.webView('Открыть каталог', …)`; отказы — по-русски
- [ ] 5.4 Адрес каталога одной функцией `https://${SITE_URL}/essence/`; кнопка `/app` в `server/src/mtcute/commands/index.ts` — на неё же (сейчас ведёт на лендинг)
- [ ] 5.5 `/invite` и `/invites` в `setMyCommands`; FAQ бота — одна строка про вход по приглашению

## 6. Клиент

- [ ] 6.1 `client/src/app/ui/login-screen.tsx`: на ошибке «Доступ по приглашению» — подсказка «Попросите ссылку-приглашение у автора каталога» под текстом ошибки

## 7. Проверка

- [ ] 7.1 `bun run fix` в `server/` и `client/`, все тесты сервера зелёные
- [ ] 7.2 Стенд: автор создаёт приглашение, ссылка открывается со второго аккаунта или временной учётки → учётка `USER`, каталог пустой; повторное открытие ссылки отклонено; незнакомый аккаунт в Mini App видит «Доступ по приглашению»

## 8. Документация

- [ ] 8.1 `docs/decisions/0009-user-auth-roles.md`: регистрация по приглашениям вместо открытой
- [ ] 8.2 `docs/status.md`, `docs/tasks/current_task.md`, `docs/versions.md` — при архиве
