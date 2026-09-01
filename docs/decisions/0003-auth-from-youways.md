# ADR 0003 — Auth, защита и тулчейн с youways

Статус: принято
Дата: 2026-09-02

## Решение

1. Регистрацию и сессии брать из youways (httpOnly cookie, refresh, rate limit), не из `origin/develop`.
2. Защиту API и Linux-хоста выравнивать с youways, без мультитенантности.
3. Зависимости и Docker-образы — свежие; разломы чинить, не откатывать.
4. Перенести `fix` + eslint + prettier с поддержкой TypeScript 7.

## Почему

На develop auth — черновик 2025. В youways уже прошли аудит: cookie, CSRF, headers, fail2ban.
Один эталон проще, чем чинить старый JWT и параллельно копировать youways.
