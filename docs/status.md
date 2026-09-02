# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **2 сентября 2026**. Дорожка D закрыта. `bun run fix` зелёный на клиенте и сервере.

| Кусок | Сейчас |
| --- | --- |
| Код | Локально линия `main`. `origin/develop` впереди — [git.md](./git.md) |
| Контур | GraphQL + Next, данные с TG, карусель |
| UI | shadcn. Пауза по клику. Drawer: порядок, типографика, теги, реакции, даты, эталоны, ключевые слова |
| Фильтры | GraphQL `lyrics(tags, keyword, emojis, dateFrom, dateTo, referencesOnly)`; сортировка на клиенте |
| Сервер | Модули (`app`, `modules/lyrics`, `graphql`, `mtcute`) |
| Lint | `bun run fix` без ошибок в `client/` и `server/` |
| Auth | Нет входа. JWT/cookie/tenant не переносили |
| OpenSpec | Активного change нет |

Дальше — дорожка **E** (сигналы и ИИ). Хост и auth — F.
