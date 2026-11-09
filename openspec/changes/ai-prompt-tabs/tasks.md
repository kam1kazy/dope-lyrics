## 1. Схема Prisma

- [x] 1.1 `server/prisma/schema.prisma`: `AiPrompt.name String?`, `AiPrompt.description String?`; `AiUsageKind` + `PROMPT_META`
- [x] 1.2 Миграция `bunx prisma migrate dev --name ai_prompt_meta` (из `server/`), закоммитить папку; `bun prisma generate`

## 2. Сервер

- [x] 2.1 `ai-prompt.service.ts`: `createPrompt(userId, { text, name, description })` с защитой от полного дубля; номер версии в списке
- [x] 2.2 `ai-prompt-meta.ts`: рамка, вызов `polza.client`, разбор JSON через `unknown`, запись в `AiUsage` (`PROMPT_META`, OK/ERROR); тест с подменённым провайдером
- [x] 2.3 `typeDefs.ts`: `AiPromptVersion.number/name/description`, `createAiPrompt`, `suggestAiPromptMeta`, снять `saveAiPrompt`, `PROMPT_META` в enum
- [x] 2.4 `ai.resolvers.ts`: подключить, проверка `ai:use`, ошибки по-русски

## 3. Клиент

- [x] 3.1 `api/queries.ts`: поля версии, `CREATE_AI_PROMPT`, `SUGGEST_AI_PROMPT_META`
- [x] 3.2 Табы-обёртка в `features/ai-settings/ui` без правки kit
- [x] 3.3 Таб «Промпт»: номер/название/описание, «Создать новый промпт» с полями и «Придумать ИИ», 4 последние версии
- [x] 3.4 Таб «Версии»: полный список с просмотром текста
- [x] 3.5 Таб «Расходы»: сводка сверху, «Последние запросы» ниже; подпись «Название промпта»

## 4. Проверка и docs

- [ ] 4.1 `bun run fix` в `client/` и `server/` (перед push; сейчас прогнаны eslint, prettier, typecheck на изменённых файлах)
- [ ] 4.2 Браузер: создать версию вручную, «Придумать ИИ», ошибка, пустой текст, старая версия без названия
- [ ] 4.3 `docs/status.md`, `docs/tasks/current_task.md`
