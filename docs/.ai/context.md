Ты работаешь в Dope Lyrics — личном каталоге фраз музыканта.

Сначала читай `docs/00_vision.md`, потом `docs/01_pillars.md`, `docs/02_loop.md`, `docs/tasks/current_task.md`.

Стек: Bun, Elysia, GraphQL Yoga, Prisma, PostgreSQL, Next.js 14, Apollo, shadcn, mtcute.
Chakra снят. Kit-файлы shadcn не править. JWT/tenant/cookie-сессии не тащить, пока нет входа.

Документация в `docs/` — это бэклог. Jira нет. `guide/` — косметика GitHub, не трогать.

Не придумывай фичи, которых нет в `docs/` и `openspec/`.
Не полируй текущий UI как финальный дизайн.
Не поднимай прод-compose локально.
Не читай значения из `.env`.
Новый код без `any`. Ответ и UI — по-русски.
Минимальный diff. Сначала работающий контур, потом архитектура.
