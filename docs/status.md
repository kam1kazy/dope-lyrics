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
| OpenSpec | Активные: `lyric-energy`, `catalog-stats-dashboard`. Specs: + `apple-notes-bot-import`. Архив: `2026-09-07-apple-notes-bot-import`, `2026-09-07-lyric-source`, … |

Ближайшее без ИИ — шлифовка. ИИ и шов — не сейчас. Mini App: [0007](./decisions/0007-mini-app-initdata.md).
