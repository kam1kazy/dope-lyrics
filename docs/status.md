# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **4 сентября 2026**. Дорожка D закрыта. **E без ИИ**: конструктор, история склеек, разрез/правка, **склейка записей** (`glueLyrics`, полка `isDonor`) — заархивировано. `bun run typecheck` зелёный на клиенте и сервере.

| Кусок | Сейчас |
| --- | --- |
| Код | Локально `main` (ahead of `origin/main`). `origin/develop` — склад — [git.md](./git.md) |
| Контур | GraphQL + Next, данные с TG, карусель |
| UI | shadcn. Меню: список, избранное, демки, сводка, **генератор** (сборка + «Склеить» + история). Карточка: профиль, полки, «Ещё…» (цензура/донор), разрез и правка |
| Фильтры | `lyrics(...)` по тегам, полкам (в т.ч. `donors`), ролям/настроению/подаче; фильтр пула генератора |
| Склейка | `assembleTrack` / `likeCollage` / `unlikeCollage` / `lyricCollages` / **`glueLyrics`**. После разреза и выреза донора слоты перекладываются |
| Сервер | Модули (`app`, `modules/lyrics`, `graphql`, `mtcute`) |
| Lint | typecheck зелёный; перед push — `bun run fix` |
| Auth | Production GraphQL: `initData` Mini App + `BOT_ADMIN_ID` |
| OpenSpec | Активных change нет. В `openspec/specs/`: + `lyric-glue`; обновлены `lyric-facets`, `track-generator`. Архив: `2026-09-04-lyric-glue`, `2026-09-03-*` |

Актуальный UI истории — `generator-history`. Ближайшее без ИИ — разрез фрагментом и нарезка списком: [roadmap E](./roadmap.md). Mini App: [0007](./decisions/0007-mini-app-initdata.md).
