## Why

Заметки приходят не только из Telegram: нужен импорт Apple Notes и явная пометка «откуда фраза», чтобы не путать корпуса и не ломать дедуп по `lyric_id`.

## What Changes

- Поле каталога `source` (`TELEGRAM` | `APPLE_NOTES`), не хештег.
- Фильтр по источнику только в меню → Список.
- Маленькая пометка источника на табе «Профиль» карточки (не в карусели и не в строке списка).
- Скрипт локального импорта экспорта Apple Notes; дедуп Telegram — пара `(source, lyric_id)`.

## Capabilities

### New Capabilities

- (нет)

### Modified Capabilities

- `lyric-facets`: источник заметки, фильтр списка, пометка на карточке.

## Impact

- Prisma: enum `LyricSource`, поле и индекс на `Lyrics`.
- GraphQL: enum, поле, аргумент `sources` у `lyrics` / `lyricIds`.
- Клиент: фильтр списка, бейдж, типы и запросы.
- Импорт: `prisma/script/import-apple-notes.ts`.
- Seed/ingest Telegram не затирает `source`; разрез/нарезка копируют.

## Non-goals

- Фильтр источника в карусели / избранном / демках / генераторе.
- Деплой и импорт на прод в этом change.
- Новые источники кроме Telegram и Apple Notes (словарь расширяем позже).
