# Локальные переменные

Пакетный менеджер — **Bun**. `bun install` / `bun run` / `bunx`. Не npm и не `package-lock.json`.

`.env` в корне, `server/.env` и `client/.env` **не коммитим**.
В репо только `*.example`.

Для проверки контура можно завести моки. Они не подключат настоящий Telegram:
бот с ними не залогинится. GraphQL и миграции — да, если поднять Postgres на порту из файла.

## Куда смотреть

| Файл | Кто читает |
| --- | --- |
| `server/.env` | Elysia, Prisma, mtcute |
| `.env` | корневой compose, если когда-нибудь понадобится |
| `client/.env` | Next, `BASE_URL` |

## Мок, который уже можно положить

- База: пользователь `dope`, пароль `dope_local`, БД `dope_lyrics`, хост `localhost`, порт **5433**
- Порты приложения: API `4000`, клиент `3000`
- Telegram-поля — заглушки (`API_ID=1`, фейковый токен). Их достаточно, чтобы файл существовал. Для парсинга чата потом подставишь свои значения сам, не в чат.

Порт **5432 занят youways** (`postgres`). Второй Postgres туда не сажать. Каталог — контейнер `dope-lyrics-db` на **5433**.

Поднять контейнер (один раз, дальше стартует вместе с Docker):

```sh
docker build -t dope-lyrics-db ./db
docker run -d --name dope-lyrics-db --restart unless-stopped -e POSTGRES_USER=dope -e POSTGRES_PASSWORD=dope_local -e POSTGRES_DB=dope_lyrics -p 5433:5432 -v dope_lyrics_data:/var/lib/postgresql dope-lyrics-db
```

Перед push — то же, что `checks` в CI: `bun run ci` в `server/` (миграции, lint, prettier, типы, тесты) и `bun run check` в `client/`.

ИИ: в `server/.env` — `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_COST_RUB_PER_1M_IN/OUT` (имена в `server/.env.example`). Пустой `AI_API_KEY` — ИИ выключен, остальное работает.

Значения из `.env` в чат и в коммит не копировать. Агент не читает эти файлы целиком.
