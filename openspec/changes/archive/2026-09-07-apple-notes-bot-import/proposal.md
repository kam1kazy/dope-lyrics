## Why

Импорт Apple Notes через CLI на сервере неудобен: нужен scp и shell. Админу нужен контур из Telegram: скрипт на Mac → zip → каталог.

## What Changes

- Команда `/notes` (только админ): выдаёт AppleScript под папку Notes, ждёт zip.
- Распаковка zip (`fflate`), импорт через общий модуль с датами из YAML.
- CLI `import:apple-notes` остаётся обёрткой над тем же модулем.

## Capabilities

### New Capabilities

- `apple-notes-bot-import`: админский импорт Notes через бота.

### Modified Capabilities

- (нет)

## Impact

- `server/src/mtcute` — команда и listener документа.
- `server/src/modules/lyrics/import` — общая логика.
- Зависимость `fflate`.
- Telegram, Mini App UI — без изменений (кроме текста бота).

## Non-goals

- Загрузка zip из Mini App.
- Агент на Mac / автозапуск osascript.
- Импорт для не-админов.
