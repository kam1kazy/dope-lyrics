# 002 — База с youways: тулчейн, образы, потом auth и хост

Статус: open
Не стартовать вместо дорожки A. Можно сразу после того, как экран открылся.

Подробности: [`../youways-baseline.md`](../youways-baseline.md)

## Сделать

1. **Тулчейн** — eslint, prettier, `fix` в пакетах **сделано**. Осталось: TS 7 как compiler.
2. **Зависимости** — поднять до свежих, починить сборку.
3. **Dockerfile / compose** — Bun, Postgres, nginx на актуальные теги. Прод-контейнер больше не сидит на каждый старт.
4. **Auth** — регистрация и сессии **из youways**, не с `origin/develop`. Пока входа нет — не писать JWT с нуля и не тащить tenant.
5. **Хост** — Linux как в youways, когда появится свой сервер.

**Процесс API** (класс защиты youways: headers, CORS, Origin/Content-Type, rate limit, Zod env, ошибки без stack, GraphQL limits, `/health`) — сделано в `server/`. Стек другой (Elysia + GraphQL), поэтому перенесли защиту, а не Express-tenant и cookie-сессии.

## Не делать

- merge develop ради «там уже был login»;
- тащить tenant, RBAC курсов, YOWA;
- полировать UI в этом же заходе.
