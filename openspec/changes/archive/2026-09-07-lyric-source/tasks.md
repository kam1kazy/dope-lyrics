## 1. Schema and API

- [x] 1.1 Prisma enum `LyricSource`, поле `source`, индекс `(source, lyric_id)`, миграция
- [x] 1.2 GraphQL enum/поле/`sources` у `lyrics` и `lyricIds`
- [x] 1.3 `buildLyricsWhere`, resolvers; Telegram create + дедуп; copy на split/slice

## 2. Client

- [x] 2.1 Типы, фрагмент запроса, переменные списка
- [x] 2.2 Фильтр источников только в меню → Список
- [x] 2.3 Пометка источника на табе «Профиль» (без карусели и строки списка)

## 3. Import

- [x] 3.1 Скрипт `import-apple-notes.ts`
- [x] 3.2 Локальная миграция и импорт экспорта
- [x] 3.3 Проверка GraphQL / локальный контур
