## Context

Бот не имеет доступа к Notes на Mac. Экспорт остаётся локальным AppleScript; бот оркестрирует выдачу скрипта и приём zip.

## Decisions

1. `/notes [путь]` — путь Notes через `/`, дефолт `Музыка/Рэпчик`. `/notes cancel` сбрасывает ожидание.
2. Выход скрипта всегда `Desktop/Dope Notes Export/`.
3. In-memory pending на 30 минут по admin user id.
4. Zip → preview-счётчики в ответе после apply (один проход).
5. Общий модуль `importAppleNotesFromFiles` для CLI и бота.
6. `fflate` для unzip без системного `unzip`.

## Risks

- Лимит Telegram ~50 МБ на документ; ставим 40 МБ.
- Первый запуск AppleScript требует доступ к Notes на Mac.
