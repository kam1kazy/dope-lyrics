# Дорожки

Идём по одной, не одним релизом.

## A. Локальный контур — закрыта

Postgres, GraphQL, Next на компе. Экран открывается.

## B. Данные из чата — закрыта

Парсинг TG, seed, фразы на экране. 2 сентября 2026.
Повторный seed пропускает существующие `lyric_id`. Индексы по `lyric_id` и `date` накатили локально.

## C. Интерфейс — сейчас

Автор решил сменить kit **до** фильтров. Chakra снят целиком. Новый экран — **shadcn**, как в youways.

- иконки — Lucide / shadcn;
- файлы kit shadcn не править: обёртки снаружи;
- другая композиция, не обязательно «телефон 640px»;
- режимы карусель / караоке / рандом;
- пауза по клику уже есть;
- нормальные empty/error.

Фильтры как запрос — дорожка D, не раздувать заглушки в C.
Задача: [`tasks/004_ui_shadcn.md`](./tasks/004_ui_shadcn.md).

## D. Инструмент

Сортировка, хештег, эмодзи, даты, число слов, полка эталонов с демо, не грузить всё разом.

Первый срез после C: случайно/новые/старые, фильтр по хештегу в GraphQL. [`tasks/003_catalog_controls.md`](./tasks/003_catalog_controls.md).

## E. Сигналы и ИИ

Когда корпус в базе и каталогом можно пользоваться. Склейка фраз, генерация, сигналы как в youways.

## F. Сервер, домен, защита

**Процесс API** (класс защиты youways, без tenant) — сделано в `server/`: Zod env, headers, CORS, Origin/Content-Type на `/graphql`, rate limit, лимит тела, 500 без stack, GraphQL без password/email, глубина и `take`, GraphiQL/Swagger не в production, `/health`, graceful shutdown, один PrismaClient.

**Регистрация и cookie-сессии** — когда появится вход, модель youways, не `origin/develop`.

**Linux-хост** — когда нужен Mini App или бот без компа: TLS, закрытый SSH, fail2ban, не светить Postgres.

См. [youways-baseline.md](./youways-baseline.md).

## G. Тулчейн и свежие версии

Lint/`fix` уже стоят. Осталось:

- TypeScript 7 как compiler;
- поднять runtime-зависимости и чинить что сломается;
- Dockerfile: Bun/Node, Postgres, nginx — актуальные теги (сейчас bun 1.2.2 и postgres 16.4). Прод-образ больше не сидит на каждый старт.

Перед push — `bun run fix` в затронутых пакетах.

## Пока не делаем

Шифрование базы «для всех», OAuth соцсетей, speech-to-text, Tune Tracker, биты, совместные комнаты.
Идеи лежат в `guide/FUTURES.md` — оттуда не тащить «заодно».
Auth с develop и самодельный JWT — тоже не делаем.
