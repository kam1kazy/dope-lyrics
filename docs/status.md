# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **4 сентября 2026**. Продукт **0.4.0** — [versions.md](./versions.md). Дорожка D закрыта. **E без ИИ**: генератор, история склеек, разрез/правка, склейка, квоты формы, разрез диапазоном, своя очередь карусели и история снимков — заархивировано. Энергия 1–5 в профиле (change `lyric-energy`). Что ещё не делали — [roadmap E](./roadmap.md). `bun run typecheck` зелёный на клиенте и сервере.

| Кусок | Сейчас |
| --- | --- |
| Код | Локально `main` (ahead of `origin/main`). `origin/develop` — склад — [git.md](./git.md) |
| Контур | GraphQL + Next, данные с TG, карусель |
| UI | shadcn. Меню: список, избранное, демки, **история карусели**, сводка, генератор. Карточка: профиль (энергия над готовностью), полки-иконки, «Ещё…», ряд очереди из меню, разрез, нарезка, правка |
| Фильтры | `lyrics(...)` по тегам, полкам (в т.ч. `donors`), ролям/настроению/подаче/энергии; фильтр пула генератора |
| Склейка | `assembleTrack(form)` / `likeCollage` / `unlikeCollage` / `lyricCollages` / `glueLyrics` / `sliceLyric`. После разреза и выреза слоты перекладываются |
| Карусель | Сессия catalog/queue; снимок своей очереди в `CarouselHistory` (кольцо 12); `lyricIds` / `lyricsByIds` |
| Сервер | Модули (`app`, `modules/lyrics`, `graphql`, `mtcute`) |
| Lint | typecheck зелёный; перед push — `bun run fix` |
| Auth | Production GraphQL: `initData` Mini App + `BOT_ADMIN_ID` |
| OpenSpec | Активный change `lyric-energy`. В `openspec/specs/`: + `carousel-history`, `carousel-queue`; обновлён `lyric-facets`. Архив: `2026-09-04-carousel-history`, `2026-09-04-lyric-card-slice`, `2026-09-04-generator-quota-settings`, `2026-09-04-lyric-glue`, `2026-09-03-*` |

История склеек — `generator-history` (шапка генератора). История карусели — пункт меню и кнопка под решафлом. Ближайшее без ИИ — шлифовка по использованию. ИИ, события карусели, запись в Telegram — не сейчас: [roadmap E](./roadmap.md). Mini App: [0007](./decisions/0007-mini-app-initdata.md).
