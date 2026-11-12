# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **12 ноября 2026**. Продукт **0.12.0** — [versions.md](./versions.md). Дорожка D закрыта. **E без ИИ** закрыта. **F закрыта**: учётка по приглашению, cookie-сессия, личный каталог, профиль с подкачкой; хост защищён, CI/CD. Что ещё не делали — [roadmap](./roadmap.md).

| Кусок | Сейчас |
| --- | --- |
| Код | `develop` — ствол, `main` = стенд (вливается из `develop` по слову «в прод») — [git.md](./git.md) |
| Стенд | https://legoblokk.ru/essence, деплой на `marzban` через CI: push в `main` → `.github/workflows/deploy.yml` (образы GHCR, `scripts/deploy/deploy-prod.sh` с бэкапом БД). Хост — [006](./tasks/006_server_hardening.md): SSH по ключу, fail2ban, бэкап в 03:30 |
| Контур | GraphQL + Next, TG и Apple Notes, карусель |
| UI | shadcn. Меню: список (фильтр «Откуда»), избранное, демки, история, сводка, эталоны (владелец), генератор; внизу — блок пользователя (клик → профиль, ⋮ → «Профиль» / «Выйти»). Экран входа |
| Фильтры | `lyrics(...)` по тегам, полкам, граням; `sources` только в списке |
| Склейка | `assembleTrack` / collage / `glueLyrics` / `sliceLyric` |
| ИИ | «Поправить ИИ» в генераторе (только `OWNER`), polza, рамка **2.1.0** (`server/src/modules/ai/rewrite/frame.ts`). Приёмы артистов по виду: образ, звук, игра слов — из полки пользователя (`Artist`), к артисту — один его текст-эталон с пояснением, до трёх на запрос. Полка «Эталоны»: карточка руками или «Заполнить с ИИ» (поиск polza в интернете, 0,50 ₽), тексты с тегами ИИ. Фильтры «Артисты» / «Тексты» в генераторе (ветка `feat/reference-shelf`, change `reference-shelf`, ждёт проверки автором). Тексты с тремя снимками и «Готово». «Настройки ИИ»: промпт с версиями, расход. «Внести правки» по пометкам строк (красный / зелёный) — этап `ai/line-marks/`. Модуль — `ai/{model,prompt,artists,rewrite,line-marks,references}`, полка — `modules/references/`. Прогоны рамки на склейках: `bun run ai:probe --collage <id> -n 5 [--artist <id>] [--text <id>] [--dry]` (ответы в `server/.ai-probe/`) |
| Карусель | catalog/queue; лайки; `isUsed`; оба источника в ленте |
| Сервер | `bun run import:apple-notes`; бот `/notes` в свой каталог, `/channel` — свой канал. Подкачка — в «Профиле»: свои каналы (у владельца ещё основной чат) читает сеанс владельца через ingest бота (`INGEST_TOKEN`, backend → `telegram-bot:4071`); дубли — по паре чат + `lyric_id` (`Lyrics.chatId`) |
| Auth | Mini App — `initData`; браузер/PWA — Telegram Login Widget (домен `legoblokk.ru` в BotFather). Сессия `dl_session` httpOnly, ротация при старте, CSRF на `/auth/*`. Роли `OWNER`/`ADMIN`/`USER` — [0009](./decisions/0009-user-auth-roles.md) |
| Регистрация | По приглашению: `/invite` в боте или блок «Приглашения» в профиле (`ADMIN`/`OWNER`) |
| Lint | `bun run fix` зелёный в `client/` и `server/` (errors и warnings) |
| Тулчейн | Postgres **18.6** (`dope-lyrics-db` на 5433). Корень/`client`/`server` — version **0.12.0**. TS 7 — не сейчас |
| OpenSpec | Активный: `reference-shelf` (код в `feat/reference-shelf`, не в `develop`). Архив: `2026-11-11-track-text-generation-settings`, `2026-11-11-ai-prompt-tabs`, `2026-11-11-generator-line-marks`, `2026-11-11-ai-generation-base`, `2026-11-09-profile-page`, `2026-11-09-invite-only-signup`, `2026-11-09-multi-user-catalog`, `2026-09-07-lyric-energy`, `2026-09-07-catalog-stats-dashboard`, … |

База ИИ (дорожка E, шаг 1) закрыта. Пометки строк закрыты (0.11.0). Табы настроек ИИ и настройки генерации в текстах закрыты (0.12.0). Дальше — по [roadmap E](./roadmap.md).
