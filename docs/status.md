# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **7 сентября 2026**. Продукт **0.6.0** — [versions.md](./versions.md). Дорожка D закрыта. **E без ИИ**: генератор, склейка, разрез, очередь, история, энергия, лайки с карусели, **источник заметки + импорт Apple Notes** — заархивировано. Что ещё не делали — [roadmap E](./roadmap.md). `bun run typecheck` зелёный на клиенте и сервере.

| Кусок | Сейчас |
| --- | --- |
| Код | Локально `main` (ahead of `origin/main`). `origin/develop` — склад — [git.md](./git.md) |
| Контур | GraphQL + Next, данные с TG и Apple Notes, карусель |
| UI | shadcn. Меню: список (фильтр «Откуда»), избранное, демки, история, сводка, генератор. Карточка: пометка источника на табе «Профиль», полки |
| Фильтры | `lyrics(...)` по тегам, полкам, ролям/настроению/подаче/энергии; `sources` только в списке |
| Склейка | `assembleTrack(form)` / `likeCollage` / `unlikeCollage` / `lyricCollages` / `glueLyrics` / `sliceLyric` |
| Карусель | Сессия catalog/queue; свайп влево → лайк; Стоп → список; `isUsed` — подсветка; оба источника в ленте |
| Сервер | Модули (`app`, `modules/lyrics`, `graphql`, `mtcute`); `bun run import:apple-notes` |
| Lint | typecheck зелёный; перед push — `bun run fix` |
| Auth | Production GraphQL: `initData` Mini App + `BOT_ADMIN_ID` |
| OpenSpec | Активные: `lyric-energy`, `catalog-stats-dashboard`. В specs обновлён `lyric-facets`. Архив: `2026-09-07-lyric-source`, `2026-09-07-carousel-session-likes`, `2026-09-04-*`, `2026-09-03-*` |

История склеек — `generator-history`. История карусели — пункт меню и кнопка; лайки с карусели пишутся как `SHUFFLE`. Ближайшее без ИИ — шлифовка и выгрузка Apple Notes на сервер. ИИ, события карусели, запись в Telegram — не сейчас: [roadmap E](./roadmap.md). Mini App: [0007](./decisions/0007-mini-app-initdata.md).
