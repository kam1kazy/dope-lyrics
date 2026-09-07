# Current task

Фаза: **D** закрыта. Продукт **0.7.0** — [versions.md](../versions.md). Дорожка **E без модели**: + импорт Apple Notes через бота.

A–C закрыты. Профиль и сводка — `lyric-facets`. Сборка — `track-assemble` / `track-generator`. Разрез и правка — `lyric-split-and-edit`. Склеить / донор — `lyric-glue`. Разрез диапазоном — `lyric-card-slice`. Очередь и история карусели — `carousel-queue` / `carousel-history`. Лайки — `carousel-session-likes`. Источник — `lyric-source`. Бот-импорт Notes — `apple-notes-bot-import`.

---

**Сделано (E без ИИ, доп.)**

- `/notes`: меню FAQ / Настройки / Скрипт / Загрузить; AppleScript (дефолт Музыка/Рэпчик); zip → каталог с датами из YAML; отмена кнопкой.
- Общий модуль `importAppleNotesFromFiles`; CLI — обёртка.
- Команда в Bot Commands (`setMyCommands`).

Архив OpenSpec: `2026-09-07-lyric-energy`, `2026-09-07-catalog-stats-dashboard`, `2026-09-07-apple-notes-bot-import`, `2026-09-07-lyric-source`, `2026-09-07-carousel-session-likes`, `2026-09-04-*`, `2026-09-03-*`.

**После 0.7.0, без новой версии:** сортировка списка по дате создания / добавления; штамп деплоя для сброса кэша Mini App; текст GraphQL-ошибки вместо «Ошибка загрузки данных». Postgres 18.6 локально. Спеки энергии и дашборда влиты в `openspec/specs`.

---

**Дальше**

- Шлифовка по использованию (zip из скрипта, тексты «загрузка» — бэклог).
- ИИ и шов — когда скажешь.

**Не сейчас:** события карусели; правка в Telegram; генерация ИИ; авторазметка; чужой эталон; шов — [roadmap E](../roadmap.md); Linux-хост и регистрация (F).
