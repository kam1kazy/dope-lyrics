# 002 — База с youways: тулчейн, образы, потом auth и хост

Статус: open
Не стартовать вместо дорожки A. Можно сразу после того, как экран открылся.

Подробности: [`../youways-baseline.md`](../youways-baseline.md)

## Сделать

1. **Тулчейн** — eslint, prettier, `fix` в пакетах **сделано**. Осталось: TS 7 как compiler.
2. **Зависимости** — поднять до свежих, починить сборку.
3. **Dockerfile / compose** — Bun, Postgres, nginx на актуальные теги.
4. **Auth** — регистрация и сессии **из youways**, не с `origin/develop`. Пока входа нет — не писать JWT с нуля.
5. **Хост** — Linux как в youways, когда появится свой сервер. **Процесс API** (headers, CORS, rate limit, env, ошибки, GraphQL limits) — сделано в `server/`.

## Не делать

- merge develop ради «там уже был login»;
- тащить tenant, RBAC курсов, YOWA;
- полировать UI в этом же заходе.
