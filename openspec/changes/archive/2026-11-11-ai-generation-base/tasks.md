## 1. Схема Prisma

- [x] 1.1 `server/prisma/schema.prisma`: модели `AiPrompt`, `AiUsage` (enum `AiUsageKind { COLLAGE_REWRITE }`, `AiUsageStatus { OK ERROR }`, `costRub Decimal?`), `TrackText`; связи у `Users`; индексы `[userId, createdAt]`
- [x] 1.2 Миграция `bunx prisma migrate dev --name ai_generation_base` (из `server/`), закоммитить папку миграции вместе с кодом; `bun prisma generate`

## 2. Сервер: окружение и доступ

- [x] 2.1 `server/src/config/env.ts`: в `httpEnvSchema` — `AI_BASE_URL`, `AI_API_KEY` (пусто = выключено), `AI_MODEL`, `AI_TIMEOUT_MS` (60000), `AI_MAX_TOKENS` (2048), `AI_STYLE_EXAMPLES` (60), `AI_COST_RUB_PER_1M_IN`, `AI_COST_RUB_PER_1M_OUT` (0); процесс без них стартует
- [x] 2.2 `server/src/modules/auth/permissions.ts`: действие `ai:use` только для `OWNER`; кейс в `permissions.test.ts`
- [x] 2.3 `server/.env.example` и `docs/local.md`: имена новых переменных без значений

## 3. Сервер: модуль ИИ

- [x] 3.1 `server/src/modules/ai/polza.client.ts`: `complete({ system, user, maxTokens })` на `fetch` + `AbortSignal.timeout`; ошибки сети, HTTP и пустой ответ — ошибки по-русски
- [x] 3.2 `server/src/modules/ai/ai-usage.service.ts`: запись вызова (OK и ERROR), `costRub` по env-ценам или `null`; сводка за сегодня / 30 дней / всё время; последние 20
- [x] 3.3 `server/src/modules/ai/ai-prompt.service.ts`: текущая версия, список версий, сохранение без дубля текущей
- [x] 3.4 `server/src/modules/ai/collage-rewrite.ts`: рамка (`FRAME_VERSION`), сборка `sourceText` из slots тем же кодом, что генератор (`track-assemble.ts` / `stripGeneratorMarks`), подбор примеров (эталоны первыми, затем пул по `LyricPoolFilter` без фраз склейки, лимит `AI_STYLE_EXAMPLES`, обрезка до 8 строк), срез обёртки ответа
- [x] 3.5 Тесты `collage-rewrite.test.ts`: эталоны первыми, фразы склейки не в примерах, чужой каталог не попадает, срез «Вот текст:» и блока кода; провайдер подменён

## 4. Сервер: тексты

- [x] 4.1 `server/src/modules/track-texts/track-texts.service.ts`: создать (пересборка `sourceText` из slots), список, один текст, сохранить `text`, «Готово» (`finalText`, `doneAt`); всё по `userId`
- [x] 4.2 Тест изоляции: чужой текст не читается и не правится

## 5. GraphQL (контракт)

- [x] 5.1 `server/src/graphql/typeDefs.ts`: типы `AiStatus { enabled }`, `AiPromptVersion`, `AiUsageSummary`, `AiUsageItem`, `CollageRewrite { sourceText aiText usageId }`, `TrackText`; query `aiStatus`, `aiPrompt`, `aiPromptVersions`, `aiUsageSummary`, `aiUsageRecent`, `trackTexts`, `trackText(id)`; mutation `saveAiPrompt(text)`, `rewriteCollage(slots, theme, filter, hideAdlibs)`, `createTrackText(slots, theme, aiText, usageId, hideAdlibs)`, `updateTrackText(id, text)`, `markTrackTextDone(id)`
- [x] 5.2 `server/src/graphql/resolvers.ts`: тонкие резолверы → сервисы, проверка `can('ai:use')` на всех
- [x] 5.3 `bun run typecheck` в `server/`

## 6. Клиент: настройки ИИ

- [x] 6.1 `client/src/features/ai-settings/`: запросы, промпт (textarea, «Сохранить», список версий с датой и просмотром), расход (три периода, «—» без цены, подпись «оценка»), последние 20 запросов; «ИИ не настроен» при `enabled = false`
- [x] 6.2 `client/src/widgets/catalog-menu/ui/catalog-menu.tsx`: `ai-settings` активен и виден только у `OWNER`, рендер раздела

## 7. Клиент: генератор и тексты

- [x] 7.1 `bun add diff` в `client/` (+ типы, если не встроены)
- [x] 7.2 `client/src/features/catalog-assemble/`: поле «Тема трека», кнопка «Поправить ИИ» (только `OWNER`, неактивна на пустой склейке и без ключа), панель ответа рядом с исходной склейкой, «Ещё раз», «Сохранить», ошибки по-русски
- [x] 7.3 `client/src/features/track-texts/`: кнопка «Тексты» в шапке генератора рядом с историей, список (дата, тема / «Без темы», «готово»), экран текста: правка + «Сохранить», «Готово», вкладки «Из моих» / «ИИ» / «Финал», шов (жёлтый / зелёный, переключатель в `localStorage`)
- [x] 7.4 `bun run typecheck` в `client/`

## 8. Проверка и доки

- [x] 8.1 `bun run fix` в `client/` и `server/` — без errors и warnings
- [x] 8.2 Руками на локали с ключом: собрать → поправить → ещё раз → сохранить → поправить руками → «Готово» → шов; расход и последние запросы растут; без ключа — «ИИ не настроен»; вход не-владельцем — ИИ не видно. Проверено 11.11.2026: сквозной путь — автор (тексты #4, #5 с «Готово», расход в «Настройках ИИ»); не-владелец — `permissions.test.ts`; «ИИ не настроен» без ключа — по коду (`isAiConfigured`), руками не гоняли
- [x] 8.3 `docs/architecture.md`: модуль `ai/` и `track-texts/` одной строкой каждый; `docs/tasks/current_task.md` — change в работе
