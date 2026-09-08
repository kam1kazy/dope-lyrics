# Current task

Фаза: **F** (вход и изоляция). Продукт **0.8.0** — [versions.md](../versions.md). OpenSpec: `multi-user-catalog` (ещё не архивирован).

A–E без ИИ закрыты. Каталог многопользовательский: учётка через Telegram, cookie-сессия, роли OWNER/ADMIN/USER, личный корпус, `/channel`, `/notes` в свой каталог.

---

**Сделано (0.8.0)**

- Схема: `UserRole`, `Session`, `ChannelBinding`, владелец у collage/history; частичный уникальный `(userId, source, lyric_id)`.
- Auth: `/auth/telegram-webapp`, `/auth/telegram-login`, refresh/logout/me; GraphQL по сессии или `initData`.
- Изоляция выборок и мутаций по `userId`; права через `can()`.
- Клиент: экран входа, выход, PWA manifest.
- ADR [0009](../decisions/0009-user-auth-roles.md) отменяет 0007.

---

**Дальше**

- Ручная проверка на двух живых Telegram-аккаунтах (задача 7.7).
- Архив OpenSpec `multi-user-catalog`.
- ИИ и шов — когда скажешь.

**Не сейчас:** события карусели; правка в Telegram; генерация ИИ; авторазметка; чужой эталон; шов — [roadmap E](../roadmap.md); Linux-хост (остаток F).
