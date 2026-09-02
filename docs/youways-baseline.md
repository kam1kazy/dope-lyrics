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

Отталкиваемся от **последних стабильных** пакетов на момент работы, не от lock февраля 2025.

Порядок:

1. Обновить runtime и библиотеки (Bun/Node, Prisma, Elysia, Next, mtcute, …).
2. Собрать, прогнать typecheck / lint.
3. Фиксить разломы точечно. Не даунгрейдить «чтобы как было».

TypeScript: цель — **TS 7** (или актуальный контур youways + их мост для Next, см. `client/scripts/link-typescript7-tsc-for-next.mjs`). Сейчас в dope-lyrics стоит TS 5.7 — это потолок каркаса, не цель.

---

## 4. Docker-образы — последние

Сейчас в репо: `oven/bun:1.2.2-alpine`, `postgres:16.4-alpine`.

При обновлении образов:

| Слой | Сейчас | Куда |
| --- | --- | --- |
| API / клиент | bun 1.2.2 | свежий `oven/bun` (или Node, если решим как youways) |
| Postgres | 16.4 | свежий `postgres:*-alpine` (18 уже крутится локально у youways) |
| nginx | stable-alpine | актуальный stable |

Пиннить digest или minor по факту сборки. `latest` без записи в доке — только если так сознательно, как server Dockerfile в youways.

---

## 5. `fix`, ESLint, Prettier

Уже перенесено в `client/` и `server/` (Bun, не npm):

- `lint` / `lint:fix` / `format` / `typecheck` / `fix`
- eslint 9 + prettier 3 + `simple-import-sort`
- правила Cursor: `.cursor/rules/lint.mdc`
- хук `afterFileEdit` на один файл

Перед push: `bun run fix` в затронутом пакете. Чинить errors и warnings.
Раннер только Bun. `package-lock.json` в репо не держим.

TypeScript 7 как compiler — ещё в дорожке G, не в этом заходе. Конфиг eslint к TS 7 готов.

---

## 6. UI — shadcn

Новый экран — shadcn, как в youways. Уходит **весь** Chakra (`react`, `next-js`, `icons`, emotion если не нужен), не только иконки.

Не сейчас: сначала оживить проект и посмотреть прототип. Снос — дорожка C.
Не наращивать Chakra до этого. Иконки новых экранов — Lucide. Kit shadcn не править.
