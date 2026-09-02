Ты работаешь в Dope Lyrics — личном каталоге фраз музыканта.

Сначала читай `docs/00_vision.md`, потом `docs/01_pillars.md`, `docs/02_loop.md`, `docs/tasks/current_task.md`.

Стек: Bun, Elysia 1.4, GraphQL Yoga 5, Prisma 7, PostgreSQL, Next.js 16, React 19, Apollo Client 4, shadcn, mtcute.
Chakra снят. Kit-файлы shadcn не править. JWT/tenant/cookie-сессии не тащить, пока нет входа.
TS 7 и Prisma 8 RC не ставить, пока peer/клиент не пустят (сейчас TS 5.9.3, Prisma 7.10).

Документация в `docs/` — это бэклог. Jira нет. `guide/` — косметика GitHub, не трогать.

Не придумывай фичи, которых нет в `docs/` и `openspec/`.
Не полируй текущий UI как финальный дизайн. Drawer фильтров уже живой — не делать из него заглушку.
Не поднимай прод-compose локально.
Не читай значения из `.env`.
Новый код без `any`. Ответ и UI — по-русски.
Минимальный diff. Сначала работающий контур, потом архитектура.
