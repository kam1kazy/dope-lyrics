# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **2 сентября 2026**. Дорожка D живая (полки). `bun run fix` зелёный на клиенте и сервере.

| Кусок | Сейчас |
| --- | --- |
| Код | Локально линия `main`. `origin/develop` впереди — [git.md](./git.md) |
| Контур | GraphQL + Next, данные с TG, карусель |
| UI | shadcn. Пауза по клику. Меню каталога справа: избранное, демки. Drawer: настройки, полки карусели, фильтры |
| Фильтры | GraphQL `lyrics(...)`, `lyricDemos`, `updateLyricFlags` |
| Сервер | Модули (`app`, `modules/lyrics`, `graphql`, `mtcute`) |
| Lint | `bun run fix` без ошибок в `client/` и `server/` |
| Auth | Нет входа. JWT/cookie/tenant не переносили |
| OpenSpec | Активного change нет |

Дальше — дорожка **E** (ИИ) или хост (F), не сейчас.
