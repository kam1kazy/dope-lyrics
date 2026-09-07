## Context

Бот не имеет доступа к Notes на Mac. Экспорт остаётся локальным AppleScript; бот оркестрирует выдачу скрипта и приём zip.

## Decisions

1. `/notes` — меню с кнопками (как `/bd`); путь Notes через Настройки или `/notes путь`, дефолт `Музыка/Рэпчик`.
2. Выход скрипта всегда `Desktop/Dope Notes Export/`.
3. In-memory: путь админа, ожидание пути, ожидание zip (~30 мин).
4. Отмена: кнопка и `/notes cancel`.
5. Zip → счётчики в ответе после apply (один проход).
6. Общий модуль `importAppleNotesFromFiles` для CLI и бота; `fflate` для unzip.
7. `setMyCommands` при старте бота включает `notes`.

## Risks

- Лимит Telegram ~50 МБ на документ; ставим 40 МБ.
- Первый запуск AppleScript требует доступ к Notes на Mac.
