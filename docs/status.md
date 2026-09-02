# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **3 сентября 2026**. Дорожка D: каталог, профиль ролей, сводка. `lyric-facets` в архиве. `bun run typecheck` зелёный на клиенте и сервере после последнего среза.

| Кусок | Сейчас |
| --- | --- |
| Код | Локально линия `main`. `origin/develop` впереди — [git.md](./git.md) |
| Контур | GraphQL + Next, данные с TG, карусель |
| UI | shadcn. Меню каталога: список, избранное, демки, сводка. Карточка: профиль по ролям, цензура |
| Фильтры | `lyrics(...)` по тегам, полкам, ролям/настроению/подаче; `catalogStats` |
| Сервер | Модули (`app`, `modules/lyrics`, `graphql`, `mtcute`) |
| Lint | После профила/сводки — typecheck зелёный; перед push — `bun run fix` |
| Auth | Нет входа. JWT/cookie/tenant не переносили |
| OpenSpec | Активного change нет. В `openspec/specs/`: `lyric-facets`, `catalog-analytics` |

Дальше — конструктор трека из кусков (начало E без ИИ), не генерация и не хост (F).
