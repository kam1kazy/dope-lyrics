# Дорожки

Идём по одной, не одним релизом.

## A. Локальный контур — закрыта

Postgres, GraphQL, Next на компе. Экран открывается.

## B. Данные из чата — закрыта

Парсинг TG, seed, фразы на экране. 2 сентября 2026.
Повторный seed пропускает существующие `lyric_id`. Индексы по `lyric_id` и `date` накатили локально.

## C. Интерфейс — kit закрыт

Chakra снят. Экран на **shadcn**, как в youways. Иконки Lucide. Kit-файлы не править.

Пауза по клику, drawer со свайпом вниз, empty/error по-русски.
Карусель и есть караоке; «случайно» — сортировка. Отдельный режим не делаем.

Фильтры живые на клиенте — см. D.

## D. Инструмент — живая

Порядок, теги, ключевые слова, эмодзи, период, тексты из демок — в GraphQL и drawer. Эталон — флаг приложения, не тег. [`tasks/003_catalog_controls.md`](./tasks/003_catalog_controls.md), [`decisions/0006-reference-is-app-flag.md`](./decisions/0006-reference-is-app-flag.md). Карточка сообщения — [`tasks/005_message_desk.md`](./tasks/005_message_desk.md).

## E. Сигналы и ИИ — не сейчас

Когда корпусом можно пользоваться и понятна карточка сообщения. Склейка фраз, генерация, сигналы как в youways.

## F. Сервер, домен, защита

**Процесс API** (класс защиты youways, без tenant) — сделано в `server/`: Zod env, headers, CORS, Origin/Content-Type на `/graphql`, rate limit, лимит тела, 500 без stack, GraphQL без password/email, глубина и `take`, GraphiQL/Swagger не в production, `/health`, graceful shutdown, один PrismaClient.

**Регистрация и cookie-сессии** — когда появится вход, модель youways, не `origin/develop`.

**Linux-хост** — когда нужен Mini App или бот без компа: TLS, закрытый SSH, fail2ban, не светить Postgres.

См. [youways-baseline.md](./youways-baseline.md).

## G. Тулчейн и свежие версии

Пакеты подняты до рабочего «самого свежего, что ставится вместе». Typecheck, lint, `next build` — зелёные.

**Взяли:** Next 16.3, React 19.2, Apollo Client 4.2, Prisma 7.10 + `@prisma/adapter-pg`, GraphQL 17 + Yoga 5, Elysia 1.4, mtcute 0.32, ESLint 10, Bun-образы 1.4.0.

**Не брали latest любой ценой:**

- TypeScript 7 — `typescript-eslint` 8.69 требует `<6.1.0`. В проекте **5.9.3**.
- Prisma CLI 8 RC — стабильный `@prisma/client` сейчас 7.10.0; CLI и клиент в паре на 7.10.0.

После `git clone`: из `server/` снова `bun prisma generate` (уже в корневом `setup`). Клиент генерируется в `server/src/generated/prisma`, URL — в `server/prisma.config.ts`.

**Осталось в G:** Postgres-образ в `db/Dockerfile` всё ещё `16.4` (локально youways на 18); TS 7 — когда eslint это позволит.

Перед push — `bun run fix` в затронутых пакетах (без ошибок и предупреждений; на клиенте и сервере уже проходит).

## Пока не делаем

Шифрование базы «для всех», OAuth соцсетей, speech-to-text, Tune Tracker, биты, совместные комнаты.
Идеи лежат в `guide/FUTURES.md` — оттуда не тащить «заодно».
Auth с develop и самодельный JWT — тоже не делаем.
