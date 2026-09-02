# 0005 — Модули на сервере (не FSD)

Дата: 2026-09-02

## Контекст

Клиент уже на FSD. Сервер был плоским: `handlers/`, `services/db`, Prisma в resolvers, два env-файла.

## Решение

Модули по образцу youways: `modules/lyrics`, `modules/users`. Входы тонкие:

- HTTP: `graphql/resolvers` → service
- Telegram: `mtcute/commands` → service / parse

FSD на сервер не переносим — ломает GraphQL + Prisma + два процесса.

## Последствия

- Фильтр `tag`/`keyword` добавляется в `lyricsService.list`.
- Контракт GraphQL для клиента не менялся.
- Поток чат → JSON → seed сохранён.
