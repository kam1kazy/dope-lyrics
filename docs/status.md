# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **7 сентября 2026**. Продукт **0.7.0** — [versions.md](./versions.md). Дорожка D закрыта. **E без ИИ**: генератор, склейка, разрез, очередь, история, энергия, лайки, источник заметки, **импорт Apple Notes через бота** (`/notes`). Что ещё не делали — [roadmap E](./roadmap.md).

| Кусок | Сейчас |
| --- | --- |
| Код | Локально `main`. `origin/develop` — склад — [git.md](./git.md) |
| Контур | GraphQL + Next, TG и Apple Notes, карусель |
| UI | shadcn. Меню: список (фильтр «Откуда»), избранное, демки, история, сводка, генератор. Пометка источника на табе «Профиль» |
| Фильтры | `lyrics(...)` по тегам, полкам, граням; `sources` только в списке |
| Склейка | `assembleTrack` / collage / `glueLyrics` / `sliceLyric` |
| Карусель | catalog/queue; лайки; `isUsed`; оба источника в ленте |
| Сервер | `bun run import:apple-notes`; бот `/notes` (меню → скрипт → zip) |
| Lint | typecheck зелёный; перед push — `bun run fix` |
| Auth | Production GraphQL: `initData` Mini App + `BOT_ADMIN_ID` |
| Тулчейн | Postgres **18.6** (`dope-lyrics-db` на 5433). Корень/`client`/`server` — version **0.7.0**. TS 7 — не сейчас |
| Шлифовка 7.09 | Сортировка списка `CREATED`/`ADDED`; сброс кэша Mini App по штампу деплоя; понятные GraphQL-ошибки (1 коммит на local main, не на origin) |
| OpenSpec | Активных changes нет. Архив: `2026-09-07-lyric-energy`, `2026-09-07-catalog-stats-dashboard`, `2026-09-07-apple-notes-bot-import`, … |

Ближайшее без ИИ — шлифовка. ИИ и шов — не сейчас. Mini App: [0007](./decisions/0007-mini-app-initdata.md).
