# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **9 ноября 2026**. Продукт **0.9.0** — [versions.md](./versions.md). Дорожка D закрыта. **E без ИИ** закрыта. **F: вход и изоляция** — на стенде: учётка по приглашению, cookie-сессия, личный каталог, профиль с подкачкой. Что ещё не делали — [roadmap](./roadmap.md).

| Кусок | Сейчас |
| --- | --- |
| Код | `main` = стенд. `origin/develop` — склад — [git.md](./git.md) |
| Стенд | https://legoblokk.ru/essence, деплой на `marzban` через CI: push в `main` → `.github/workflows/deploy.yml` (образы GHCR, `scripts/deploy/deploy-prod.sh` с бэкапом БД) |
| Контур | GraphQL + Next, TG и Apple Notes, карусель |
| UI | shadcn. Меню: список (фильтр «Откуда»), избранное, демки, история, сводка, генератор; внизу — блок пользователя (клик → профиль, ⋮ → «Профиль» / «Выйти»). Экран входа |
| Фильтры | `lyrics(...)` по тегам, полкам, граням; `sources` только в списке |
| Склейка | `assembleTrack` / collage / `glueLyrics` / `sliceLyric` |
| Карусель | catalog/queue; лайки; `isUsed`; оба источника в ленте |
| Сервер | `bun run import:apple-notes`; бот `/notes` в свой каталог, `/channel` — свой канал. Подкачка — в «Профиле»: свои каналы (у владельца ещё основной чат) читает сеанс владельца через ingest бота (`INGEST_TOKEN`, backend → `telegram-bot:4071`); дубли — по паре чат + `lyric_id` (`Lyrics.chatId`) |
| Auth | Mini App — `initData`; браузер/PWA — Telegram Login Widget (домен `legoblokk.ru` в BotFather). Сессия `dl_session` httpOnly, ротация при старте, CSRF на `/auth/*`. Роли `OWNER`/`ADMIN`/`USER` — [0009](./decisions/0009-user-auth-roles.md) |
| Регистрация | По приглашению: `/invite` в боте или блок «Приглашения» в профиле (`ADMIN`/`OWNER`) |
| Lint | `bun run fix` зелёный в `client/` и `server/` (errors и warnings) |
| Тулчейн | Postgres **18.6** (`dope-lyrics-db` на 5433). Корень/`client`/`server` — version **0.9.0**. TS 7 — не сейчас |
| OpenSpec | Активных changes нет. Архив: `2026-11-09-profile-page`, `2026-11-09-invite-only-signup`, `2026-11-09-multi-user-catalog`, `2026-09-07-lyric-energy`, `2026-09-07-catalog-stats-dashboard`, … |

Ближайшее без ИИ — шлифовка. ИИ и шов — не сейчас.
