# ADR 0007 — Закрыть каталог через Mini App, не регистрацию

Статус: принято
Дата: 2026-09-03

## Решение

Пока один автор. Вход — подпись Telegram `initData` и совпадение `user.id` с `BOT_ADMIN_ID`. Не cookie youways и не JWT с develop.

HTTP Basic Auth на `/essence` снимаем: WebView Mini App его не показывает, открывается главная Lucky.

Локальный `NODE_ENV=development` проверку не включает.

## Почему

Регистрация в дорожке F «когда появится вход». Для соло это лишние страницы. Подпись Mini App закрывает GraphQL без формы.
