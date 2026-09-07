# Что берём из youways

YouWays — эталон сессий, защиты и тулчейна.
Не эталон продукта: мультитенантность, RBAC курсов и YOWA сюда не тащим.

Исходник: репозиторий `youways/youways` на этой машине.
`origin/develop` этого проекта **не** источник авторизации — там черновик JWT/NextAuth.

---

## 1. Регистрация и сессии

Когда появится вход — переносить модель youways, не писать вторую с нуля и не cherry-pick март 2025 с develop.

Ориентир (youways `docs/product/auth-guide.md`, `docs/api/auth.md`):

- access + refresh;
- refresh (и access в актуальном контуре) в **httpOnly cookie**, не в `localStorage`;
- короткий access, тихий `/auth/refresh`;
- bcrypt, Zod на входе, rate limit на login;
- CSRF / security headers на API;
- сессия живёт на сервере, клиент не «сам себе JWT».

Для одного автора можно упростить UI (без орг и ролей курса).
Упрощать защиту cookie и сессии — нельзя.

---

## 2. Защита Node и Linux

Когда появится свой сервер — тот же класс защиты, что в youways, урезанный под один инстанс.

**Процесс Node / API** (сделано в `dope-lyrics/server`)

- security headers;
- CORS allowlist + проверка Origin / Content-Type на `/graphql`;
- rate limit на публичные точки;
- без stack trace наружу;
- секреты только в env, не в образе и не в git.
- Zod на старте HTTP; GraphQL без password/email; лимит глубины и `take`.

**Хост Linux**

- как в youways ops: свежие пакеты, закрытый SSH, fail2ban / аналог, минимум открытых портов, TLS, не светить Postgres наружу.
- nginx: не тащить продовый IP-allowlist с 2025 как единственную защиту; нормальный TLS + auth + заголовки.

Не копировать tenant-middleware и platform-admin.

---

## 3. Зависимости — свежие, чинить что всплывёт

Отталкиваемся от **последних стабильных**, которые ставятся **вместе**, не от lock февраля 2025 и не от `latest` любой ценой.

Порядок:

1. Обновить runtime и библиотеки (Bun/Node, Prisma, Elysia, Next, mtcute, …).
2. Собрать, прогнать typecheck / lint / `next build`.
3. Фиксить разломы точечно. Не даунгрейдить «чтобы как было».

**Снимок 2 сентября 2026** (рабочий набор):

| Пакет | Версия |
| --- | --- |
| Next / React | 16.3.4 / 19.2.8 |
| Apollo Client | 4.2.12 (`HttpLink`, хуки из `@apollo/client/react`, `rxjs`) |
| Prisma | 7.10.0 + `@prisma/adapter-pg`. Генерация: `server/src/generated/prisma`. URL: `server/prisma.config.ts` |
| GraphQL / Yoga | 17.0.2 / 5.22.0 (Yoga напрямую, не `@elysiajs/graphql-yoga`) |
| Elysia / mtcute | 1.4.30 / 0.32.1 |
| ESLint | 10.9 |
| TypeScript | **5.9.3** |

**Не ставить сейчас:**

- TypeScript **7.0.2** — `@typescript-eslint` 8.69 падает, peer только `<6.1.0`.
- Prisma CLI **8.0.0-rc** — `@prisma/client` 8 под неё не публикуется (`latest` клиента 7.10.0). Держать CLI и клиент в паре.

После клона: `bun prisma generate` из `server/` (корневой `setup` это делает).

TypeScript 7 — цель, когда eslint-peer пустит. Мост youways (`link-typescript7-tsc-for-next.mjs`) сюда не копировать, пока TS 7 нельзя.

---

## 4. Docker-образы — последние

Образы приложения: `oven/bun:1.4.0-alpine` (`client/` и `server/`). Postgres в `db/Dockerfile`, compose и прод — `18.6-alpine`. Локальный контейнер `dope-lyrics-db` на 5433. Прод-контейнер API больше не сидит на каждый старт.

При следующем обновлении образов:

| Слой | Сейчас | Куда |
| --- | --- | --- |
| API / клиент | bun 1.4.0 | свежий `oven/bun` (или Node, если решим как youways) |
| Postgres | 18.6-alpine | свежий `postgres:*-alpine` |
| nginx | stable-alpine | актуальный stable |

Пиннить digest или minor по факту сборки. `latest` без записи в доке — только если так сознательно, как server Dockerfile в youways.

---

## 5. `fix`, ESLint, Prettier

Уже перенесено в `client/` и `server/` (Bun, не npm):

- `lint` / `lint:fix` / `format` / `typecheck` / `fix`
- eslint 10 + prettier 3 + `simple-import-sort`
- правила Cursor: `.cursor/rules/lint.mdc`
- хук `afterFileEdit` на один файл

Перед push: `bun run fix` в затронутом пакете. Чинить errors и warnings.
Раннер только Bun. `package-lock.json` в репо не держим.

TypeScript 7 как compiler — когда `@typescript-eslint` пустит TS ≥6. Сейчас 5.9.3, это потолок peer, не цель навсегда.

---

## 6. UI — shadcn

Новый экран — shadcn, как в youways. Chakra снят целиком (`react`, `next-js`, `icons`, emotion).

Иконки — Lucide. Файлы kit shadcn не править: обёртки снаружи. Не возвращать Chakra.
