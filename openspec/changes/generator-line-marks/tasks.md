## 1. Схема Prisma

- [ ] 1.1 `server/prisma/schema.prisma`: значение `LINE_MARKS` в `enum AiUsageKind`
- [ ] 1.2 Миграция из `server/`: `bunx prisma migrate dev --create-only --name ai_usage_line_marks`, в SQL `ALTER TYPE "AiUsageKind" ADD VALUE 'LINE_MARKS';`, применить, `bun prisma generate`; папку миграции закоммитить

## 2. Сервер: этап «Внести правки»

- [ ] 2.1 `server/src/modules/ai/line-marks/frame.ts`: `LINE_MARKS_FRAME_VERSION = '1.0.0'`, рамка правки одной строки (ядро, ударная гласная как у соседей, без затычек и быта, не смягчать, не переводить, одна строка на номер, ответ — только JSON `{"lines":[{"n","text"}]}`); без примеров из склеек
- [ ] 2.2 `server/src/modules/ai/line-marks/request.ts`: проверка меток (индекс в `aiText.split('\n')`, строка непустая, не метка части, есть хотя бы одна красная) с ошибками по-русски; сборка user-сообщения (тема, промпт автора, строки `n | R/G/· | текст`); разбор JSON (`zod`) и сборка итогового текста — замена только красных строк, проверка «у каждой красной есть одна непустая строка без переноса»
- [ ] 2.3 `server/src/modules/ai/line-marks/request.test.ts`: зелёные, неотмеченные и метки частей не меняются при любом ответе модели; лишние номера отброшены; нет строки для красной, пустая строка, перенос внутри, не JSON — ошибка; метка на `[Хук]` и пустой строке — ошибка; число строк прежнее
- [ ] 2.4 `server/src/modules/ai/line-marks/line-marks.service.ts`: `reviseMarkedLines(userId, { aiText, marks, theme })` — `isAiConfigured`, проверки из 2.2, текущий промпт (`prompt/ai-prompt.service.ts`), `callModel({ kind: 'LINE_MARKS', frameVersion: LINE_MARKS_FRAME_VERSION, … }, parse)`; вернуть `{ aiText, usageId }`

## 3. Контракт GraphQL

- [ ] 3.1 `server/src/graphql/typeDefs.ts`: `enum LineMark { RED GREEN }`, `input LineMarkInput { line: Int!, mark: LineMark! }`, `type LineMarksRevision { aiText: String!, usageId: Int! }`, мутация `reviseMarkedLines(aiText: String!, marks: [LineMarkInput!]!, theme: String): LineMarksRevision!`
- [ ] 3.2 `server/src/graphql/ai.resolvers.ts`: резолвер через `requireAi` (`ai:use`), вызов `reviseMarkedLines`; `bun run typecheck` и `bun test src/modules/ai` в `server/` зелёные

## 4. Клиент: компонент «было / стало»

- [ ] 4.1 `client/src/shared/ui/before-after-text/pair-blocks.ts`: у `RewriteBlock` поле `afterLine` — индекс первой строки абзаца «после» в `after.split('\n')` (`-1` у пустого); тест в `pair-blocks.test.ts` с несколькими пустыми строками между абзацами и метками частей
- [ ] 4.2 `client/src/shared/ui/before-after-text/index.tsx`: пропсы `marks` и `onToggleMark`; при `onToggleMark` — короткий клик по строке «стало» метит строку (`afterLine + i`), метка части и пустая строка не метятся; зажатие блока (~350 мс, сдвиг ≤ 8 px) показывает «было» до отпускания и не засчитывается кликом; меню блока, свайп, двойной клик-правка и закрепление абзаца выключены; фон красной и зелёной строки отличен от подсветки изменений
- [ ] 4.3 Проверить, что `client/src/features/track-texts/ui/track-text-view.tsx` (без `onToggleMark`) ведёт себя как раньше: клик закрепляет абзац, свайп открывает меню

## 5. Клиент: генератор

- [ ] 5.1 `client/src/features/catalog-assemble/api/ai-queries.ts`: мутация `REVISE_MARKED_LINES` и типы
- [ ] 5.2 `client/src/features/catalog-assemble/ui/collage-rewrite-panel.tsx`: состояние `marks`; передать в `BeforeAfterText` `marks` и `onToggleMark` (цикл без метки → красная → зелёная → без метки), убрать `onAfterChange`; «Ещё раз» заменить на «Внести правки» (неактивна без красных, спиннер во время запроса); ответ заменяет `aiText`, снимает красные, оставляет зелёные; ошибка — текст у кнопок, ответ и метки прежние; «Поправить ИИ» сбрасывает метки; «Сохранить в тексты» без меток
- [ ] 5.3 `client/src/features/ai-settings/ui/usage-tab.tsx`: подпись `LINE_MARKS` — «Правка по пометкам»
- [ ] 5.4 `bun run typecheck` в `client/`

## 6. Проверка и доки

- [ ] 6.1 `bun run fix` в `client/` и `server/` — без errors и warnings
- [ ] 6.2 Руками на локали с ключом: собрать → «Поправить ИИ» → пометить 2 красные и 1 зелёную → «Внести правки» → поменялись только красные, зелёная осталась зелёной; зажатие показывает «было»; в «Настройках ИИ» запись «Правка по пометкам»; в «Текстах» абзацы и меню работают как раньше
- [ ] 6.3 `docs/roadmap.md` (пометки строк — в работе / сделано), `docs/status.md`, `docs/tasks/current_task.md`
