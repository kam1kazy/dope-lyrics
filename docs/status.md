# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **2 сентября 2026**. Контур живой. Chakra снят. Класс защиты API с youways — в `server/`.

| Кусок | Сейчас |
| --- | --- |
| Код | Локально линия `main`. `origin/develop` впереди — [git.md](./git.md) |
| Контур | GraphQL + Next на компе, данные с TG в базе, экран живой |
| Данные | `chatHistory.json` и seed сделаны (`bot-data/` в git не входят). Повторный seed пропускает существующие `lyric_id` |
| Бот | Подключён. Callback `/bd` снова через `useAdminCheck` |
| UI | shadcn + FSD. Chakra в зависимостях нет. Клик по экрану — пауза. Фильтры в drawer — заглушки |
| Зависимости | Актуальный рабочий набор: Next 16, React 19, Apollo 4, Prisma 7 + adapter-pg, GraphQL 17, Yoga 5, Elysia 1.4, mtcute 0.32, ESLint 10, TS 5.9. Typecheck/lint зелёные, `next build` собирается, `/health` и GraphQL отвечают |
| API | Zod env, CORS, headers, rate limit, лимит тела и глубины GraphQL, `lyrics(limit, offset)`, `/health`. GraphiQL/Swagger не в production |
| Auth | Нет входа. JWT/cookie/tenant с youways и с develop — не переносили |
| OpenSpec | Активного change нет |

Дальше — дорожка C (добить экран на shadcn). Фильтры как запрос — D. ИИ и хост — позже.
