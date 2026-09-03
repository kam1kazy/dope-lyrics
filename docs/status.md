# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **4 сентября 2026**. Дорожка D закрыта. **E без ИИ**: конструктор, история, разрез/правка, склейка, квоты формы, **разрез диапазоном и нарезка списком** (`sliceLyric`) — заархивировано. `bun run typecheck` зелёный на клиенте и сервере.

| Кусок | Сейчас |
| --- | --- |
| Код | Локально `main` (ahead of `origin/main`). `origin/develop` — склад — [git.md](./git.md) |
| Контур | GraphQL + Next, данные с TG, карусель |
| UI | shadcn. Меню: список, избранное, демки, сводка, **генератор** (квоты + «Склеить» + история). Карточка: профиль, полки, «Ещё…», разрез (одна/две черты), нарезка списком, правка |
| Фильтры | `lyrics(...)` по тегам, полкам (в т.ч. `donors`), ролям/настроению/подаче; фильтр пула генератора |
| Склейка | `assembleTrack(form)` / `likeCollage` / `unlikeCollage` / `lyricCollages` / `glueLyrics` / **`sliceLyric`**. После разреза и выреза слоты перекладываются |
| Сервер | Модули (`app`, `modules/lyrics`, `graphql`, `mtcute`) |
| Lint | typecheck зелёный; перед push — `bun run fix` |
| Auth | Production GraphQL: `initData` Mini App + `BOT_ADMIN_ID` |
| OpenSpec | Активных change нет. В `openspec/specs/`: + `lyric-card-slice`; обновлены `lyric-split-and-edit`, `track-generator`. Архив: `2026-09-04-lyric-card-slice`, `2026-09-04-generator-quota-settings`, `2026-09-04-lyric-glue`, `2026-09-03-*` |

Актуальный UI истории — `generator-history`. Ближайшее без ИИ — шлифовка по использованию; ИИ — когда скажешь: [roadmap E](./roadmap.md). Mini App: [0007](./decisions/0007-mini-app-initdata.md).
