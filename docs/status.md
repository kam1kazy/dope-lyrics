# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **7 сентября 2026**. Продукт **0.5.0** — [versions.md](./versions.md). Дорожка D закрыта. **E без ИИ**: генератор, склейка, разрез, очередь, история карусели, энергия, **сбор лайков с карусели** (`carousel-session-likes`) — заархивировано. Что ещё не делали — [roadmap E](./roadmap.md). `bun run typecheck` зелёный на клиенте и сервере.

| Кусок | Сейчас |
| --- | --- |
| Код | Локально `main` (ahead of `origin/main`). `origin/develop` — склад — [git.md](./git.md) |
| Контур | GraphQL + Next, данные с TG, карусель |
| UI | shadcn. Меню: список, избранное, демки, история карусели, сводка, генератор. Карточка: профиль, полки (в т.ч. «Использовал»), ряд очереди из меню. Chrome: решафл, **Стоп**, история |
| Фильтры | `lyrics(...)` по тегам, полкам (в т.ч. `donors`), ролям/настроению/подаче/энергии; фильтр пула генератора |
| Склейка | `assembleTrack(form)` / `likeCollage` / `unlikeCollage` / `lyricCollages` / `glueLyrics` / `sliceLyric` |
| Карусель | Сессия catalog/queue; свайп влево → лайк сообщения; Стоп → список; снимок `CarouselHistory` (`QUEUE` / `SHUFFLE`); `isUsed` — подсветка без скрытия |
| Сервер | Модули (`app`, `modules/lyrics`, `graphql`, `mtcute`) |
| Lint | typecheck зелёный; перед push — `bun run fix` |
| Auth | Production GraphQL: `initData` Mini App + `BOT_ADMIN_ID` |
| OpenSpec | Активный change `lyric-energy`. В `openspec/specs/`: + `carousel-session-likes`; обновлены `carousel-history`, `lyric-facets`. Архив: `2026-09-07-carousel-session-likes`, `2026-09-04-*`, `2026-09-03-*` |

История склеек — `generator-history`. История карусели — пункт меню и кнопка; лайки с карусели пишутся как `SHUFFLE`. Ближайшее без ИИ — шлифовка. ИИ, события карусели, запись в Telegram — не сейчас: [roadmap E](./roadmap.md). Mini App: [0007](./decisions/0007-mini-app-initdata.md).
