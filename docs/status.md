# Состояние

Продукт: [00_vision.md](./00_vision.md). Текущая задача: [tasks/current_task.md](./tasks/current_task.md).

Снимок: **2 сентября 2026**. Репо `main` @ `bcba015` (23 февраля 2025).

| Кусок | Сейчас |
| --- | --- |
| Код | Локально `main` @ `bcba015`. `origin/develop` на 62 коммита впереди — [git.md](./git.md) |
| Зависимости | Нет `node_modules` в корне, `client/`, `server/` |
| Секреты | Локальные моковые `.env` есть, в git не входят |
| Данные чата | Нет `server/bot-data/data/chatHistory.json` |
| Сессии Telegram | Нет, `bot-data` в gitignore |
| Миграции Prisma | Нет в репо (папка была в `.gitignore`) |
| Docker Desktop | Включён, engine 29.5.3 |
| Postgres | Контейнер `postgres` на **5432** — youways, не наш |
| Redis | Поднят, проекту не нужен |
| Бот в Telegram | Не проверен: нет `BOT_TOKEN` на машине |
| OpenSpec | Корень `openspec/`, schema `spec-driven`, активных change нет |

Compose в репо — продовый (nginx, SSL, Docker Hub). Для локали целиком не поднимаем.

Следующий шаг — дорожка A в [roadmap.md](./roadmap.md): база, `.env` только с Postgres, `bun run setup`.
