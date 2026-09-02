# Current task

Фаза: **C. Интерфейс** — [`../roadmap.md`](../roadmap.md)

A и B закрыты. Kit сменён: Chakra нет, экран на shadcn. Класс защиты API с youways — в `server/` (не tenant, не JWT, не cookie-сессии).

---

**Current:** добить экран на shadcn, не возвращая Chakra.

- kit-файлы shadcn не править: обёртки снаружи;
- иконки — Lucide;
- композиция может уйти от «телефона 640px»;
- empty / error по-русски;
- Play уже есть (клик по экрану). Отдельная кнопка — если понадобится по дизайну.

План kit: [`004_ui_shadcn.md`](004_ui_shadcn.md)

---

**Дальше:** D — фильтры как запрос, сортировка, хештег. [`003_catalog_controls.md`](003_catalog_controls.md)

**Не сейчас:** ИИ (E); Linux-хост и регистрация (F). TS 7 / Prisma 8 — пока eslint и клиент Prisma не пустят ([`002_youways_baseline.md`](002_youways_baseline.md)). Эталон auth — youways, не develop.

OpenSpec: если пойдёт новый экран целиком — `/opsx-propose ui-shadcn`.
