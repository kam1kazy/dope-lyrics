# 002 — База с youways: тулчейн, образы, потом auth и хост

Статус: open (пакеты закрыты, образы Postgres и TS 7 — нет)
Не стартовать вместо дорожки C. Подробности: [`../youways-baseline.md`](../youways-baseline.md)

## Сделать

1. **Тулчейн** — eslint 10, prettier 3, `fix` **сделано**. TS 7 — блокер: `typescript-eslint` peer `<6.1.0`.
2. **Зависимости** — **сделано** (2 сентября 2026). Рабочий набор: Next 16, React 19, Apollo 4, Prisma 7 + adapter-pg, GraphQL 17, Yoga 5, Elysia 1.4, mtcute 0.32. Не брать Prisma 8 RC и TS 7, пока реестр/peer не пустят.
3. **Dockerfile / compose** — Bun уже `1.4.0`. Осталось: Postgres `16.4` → свежий тег. Прод-контейнер больше не сидит на каждый старт.
4. **Auth** — регистрация и сессии **из youways**, не с `origin/develop`. Пока входа нет — не писать JWT с нуля и не тащить tenant.
5. **Хост** — Linux как в youways, когда появится свой сервер.

**Процесс API** (класс защиты youways) — сделано в `server/`. Стек другой (Elysia + Yoga 5), поэтому перенесли защиту, а не Express-tenant и cookie-сессии.

После клона: `bun prisma generate` из `server/`.

## Не делать

- merge develop ради «там уже был login»;
- тащить tenant, RBAC курсов, YOWA;
- полировать UI в этом же заходе;
- ставить TS 7 или Prisma 8 RC «чтобы latest».
