# ADR 0009 — Учётка, сессия и роли вместо только Mini App

Статус: принято
Дата: 2026-09-07
Отменяет: [0007](./0007-mini-app-initdata.md)

## Решение

1. Учётка заводится по Telegram-аккаунту (Mini App `initData` или Login Widget). Пароля нет.
2. Сессия — httpOnly cookie (`dl_session`) с записью в БД и refresh; GraphQL в production пускает по сессии **или** по `initData`.
3. Роли `OWNER` | `ADMIN` | `USER`; права — матрица в `permissions.ts` через `can()`. UI управления ролями нет.
4. Каталог личный: все выборки и мутации с `userId` владельца. `BOT_ADMIN_ID` → роль `OWNER` при миграции, не единственный пропуск.

## Почему

Друзьям нужен свой корпус и вход вне чата (PWA). Один `BOT_ADMIN_ID` это ломает. Cookie youways-модель без tenant; Mini App не переводим целиком на cookie из‑за WebView.
