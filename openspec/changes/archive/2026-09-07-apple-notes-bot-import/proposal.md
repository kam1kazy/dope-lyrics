## Why

Импорт Apple Notes через CLI на сервере неудобен: нужен scp и shell. Админу нужен контур из Telegram: скрипт на Mac → zip → каталог.

## What Changes

- Команда `/notes` в Bot Commands (только админ): меню FAQ / Настройки / Скрипт / Загрузить.
- AppleScript под путь Notes; ожидание zip; кнопка Отмена и `/notes cancel`.
- Распаковка zip (`fflate`), импорт через общий модуль с датами из YAML.
- CLI `import:apple-notes` остаётся обёрткой над тем же модулем.

## Capabilities

### New Capabilities

- `apple-notes-bot-import`: админский импорт Notes через бота.

### Modified Capabilities

- (нет)

## Impact

- `server/src/mtcute` — команда, callbacks, listener документа, `setMyCommands`.
- `server/src/modules/lyrics/import` — общая логика.
- Зависимость `fflate`.
- Mini App UI — без изменений.

## Non-goals

- Загрузка zip из Mini App.
- Агент на Mac / автозапуск osascript / zip внутри AppleScript.
- Импорт для не-админов.
