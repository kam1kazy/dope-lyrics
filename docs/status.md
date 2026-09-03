# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **3 сентября 2026**. Дорожка D закрыта. Начало **E без ИИ** влито и заархивировано: конструктор трека, история склеек, разрез и правка текста. `bun run typecheck` зелёный на клиенте и сервере.

| Кусок | Сейчас |
| --- | --- |
| Код | Локально `main` (ahead of `origin/main`). `origin/develop` — склад — [git.md](./git.md) |
| Контур | GraphQL + Next, данные с TG, карусель |
| UI | shadcn. Меню: список, избранное, демки, сводка, **генератор** (сборка + история в шапке). Карточка: профиль, полки, разрез и правка текста |
| Фильтры | `lyrics(...)` по тегам, полкам, ролям/настроению/подаче; фильтр пула генератора |
| Склейка | `assembleTrack` / `likeCollage` / `unlikeCollage` / `lyricCollages`. После разреза слоты с `startLine`/`endLine` перекладываются на верх/низ |
| Сервер | Модули (`app`, `modules/lyrics`, `graphql`, `mtcute`) |
| Lint | typecheck зелёный; перед push — `bun run fix` |
| Auth | Production GraphQL: `initData` Mini App + `BOT_ADMIN_ID` |
| OpenSpec | Активных change нет. В `openspec/specs/`: `lyric-facets`, `catalog-analytics`, `lyric-split-and-edit`, `track-assemble`, `collage-history`, `track-generator`, `generator-history`. Архив: `2026-09-03-lyric-facets`, `lyric-split-and-edit`, `track-assemble`, `track-generator` |

Актуальный UI истории — `generator-history` (иконка в шапке генератора); `collage-history` — первый срез со сборкой в «Истории». Ближайшее без ИИ — склеить записи и резать фрагментом: [roadmap E](./roadmap.md). Mini App: [0007](./decisions/0007-mini-app-initdata.md).
