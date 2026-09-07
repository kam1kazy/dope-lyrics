# Current task

Фаза: **D** закрыта. Продукт **0.7.0** — [versions.md](../versions.md). Дорожка **E без модели**: + импорт Apple Notes через бота.

A–C закрыты. Профиль и сводка — `lyric-facets`. Сборка — `track-assemble` / `track-generator`. Разрез и правка — `lyric-split-and-edit`. Склеить / донор — `lyric-glue`. Разрез диапазоном — `lyric-card-slice`. Очередь и история карусели — `carousel-queue` / `carousel-history`. Лайки — `carousel-session-likes`. Источник — `lyric-source`. Бот-импорт Notes — `apple-notes-bot-import`.

---

**Сделано (E без ИИ, доп.)**

- `/notes` [путь]: админ получает AppleScript (дефолт Музыка/Рэпчик), ждёт zip с Desktop/`Dope Notes Export`, импортирует в каталог с датами из YAML.
- Общий модуль `importAppleNotesFromFiles`; CLI — обёртка.

Архив OpenSpec: `2026-09-07-apple-notes-bot-import`, `2026-09-07-lyric-source`, `2026-09-07-carousel-session-likes`, `2026-09-04-*`, `2026-09-03-*`.

---

**Дальше**

- Шлифовка по использованию; при необходимости прогон `/notes` на проде.
- ИИ и шов — когда скажешь.

**Не сейчас:** события карусели; правка в Telegram; генерация ИИ; авторазметка; чужой эталон; шов — [roadmap E](../roadmap.md); Linux-хост и регистрация (F).
