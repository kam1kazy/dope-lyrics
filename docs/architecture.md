# Архитектура

## Поток

```
Telegram-чат
  → user-сеанс mtcute читает историю
  → filterHistory (слова, абзацы, хештеги, реакции)
  → chatHistory.json
  → Prisma seed
  → Postgres
  → GraphQL `lyrics`
  → карусель на Next
```

Команды бота: `/chatid`, `/app`, `/bd` (статистика, парсинг, посев, очистка).
Кнопки `/bd` и callback (`stats` / `history` / `seed` / `clear`) проверяют `BOT_ADMIN_ID`.

Клиент: Next 16, React 19, Apollo Client 4 (`HttpLink`, хуки из `@apollo/client/react`), FSD, shadcn (Chakra снят). Фразы режутся по `\n`; скорость карусели — слайдер в drawer.
Пауза — клик по экрану. Порядок, теги (OR), ключевые слова и типографика считаются на клиенте после `lyrics`. Drawer закрывается свайпом вниз.

Слои в `client/src`: `app` (роутер Next) → `widgets` → `features` → `entities` → `shared`.
Импорт только вниз. Публичный API слайса — `index.ts`. Слой `pages` не используем: конфликт с Next `src/pages`.

## Telegram: бот и домен

Публичный сервер не нужен, чтобы забрать заметки.

| Задача | Нужен домен |
| --- | --- |
| Прочитать историю чата | Нет. Нужен user-сеанс и процесс на компе |
| Команды `/bd`, `/chatid` | Нет. mtcute по MTProto, не webhook |
| Mini App `/app` внутри Telegram | Да, HTTPS в BotFather |
| Бот, когда комп выключен | Да |

Парсинг делает `tgAdmin` (аккаунт), не бот. Токен — для кнопок.
История чата типизирована через `Message` / `MessageEntity` / `Peer` из `@mtcute/core`. `getChatHistory` собирает `ILyric[]`. `editDate` — `Date | null`. FLOOD_WAIT — `unknown` + сужение. Самописного `dataMessage.ts` нет.

Два клиента в `server/src/mtcute/index.ts`:

1. Бот — `BOT_TOKEN`
2. Админ — телефон + 2FA + код. Нужен для `getHistory`

`env.ts` падает без полного набора TG-переменных. GraphQL их не читает.

## Проверка бота

Из репо токен не достать.

1. @BotFather → список ботов.
2. Написать `/start`: ответ = где-то ещё крутится процесс; тишина = токена, скорее всего, хватает, слушателя нет; deleted — создавать заново.
3. В BotFather: токен, Mini App URL, права в чате заметок.
4. Когда токен будет в окружении пользователя: `getMe` → `"ok": true`.

User-сеанс в клоне мёртв. `API_ID` / `API_HASH` — [my.telegram.org/apps](https://my.telegram.org/apps).

## Схема

`Users` → `Lyrics` → `Message` + `Hashtags` / `Reactions` / `Chat` / `Media`.
`lyric_id` без unique в схеме; повторный seed пропускает уже существующие id. Индексы по `lyric_id` и `date`.
Seed ищет `Users.id = 1`.
Хештеги — `String[]` на сообщение. GraphQL `lyrics(limit, offset)` без `password` / `email`, глубина запроса ограничена.

HTTP: Elysia 1.4 + GraphQL Yoga 5 (не `@elysiajs/graphql-yoga`). Zod env, CORS, security headers, rate limit, лимит тела, `/health`, GraphiQL/Swagger только не в production, 500 без stack, graceful shutdown. Один PrismaClient 7 (`@prisma/adapter-pg`, выход генерации `server/src/generated/prisma`, URL в `prisma.config.ts`).

После чистой установки: `bun prisma generate` из `server/` (корневой `setup`).

## Техдолг

| Тема | Зачем помнить |
| --- | --- |
| Миграции не в репо | Новые — коммитить, не возвращать в gitignore |
| Apollo → `/graphql` | Без прокси локальный клиент не увидит API |
| Жёсткий `env.ts` бота | Без секретов бота не стартовать |
| `password` / `email` в GraphQL | Схема больше не отдаёт; в Prisma-типе User могут остаться |
| Auth / cookie-сессии | Когда появится вход — модель youways, не invent и не develop |
| Linux-хост | Когда будет свой сервер: TLS, закрытый SSH, не светить Postgres |
| Prisma generate | После клона без `setup` клиент не появится в `src/generated/prisma` |
| Прод-Docker seed | Контейнер больше не сидит на каждый старт |
| Фильтр каталога | Теги и слова считаются на клиенте; в GraphQL ещё нет `tag`/`keyword` |
| TS 7 / Prisma 8 | Не ставить: eslint peer `<6.1.0`, клиента Prisma 8 в реестре нет |
