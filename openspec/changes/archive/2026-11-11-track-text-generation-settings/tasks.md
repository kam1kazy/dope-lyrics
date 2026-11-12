# Tasks

> Начинать после архива `ai-generation-base`: там модель `TrackText` и `createTrackText`.

## 1. Схема Prisma

- [x] 1.1 `server/prisma/schema.prisma`: у `TrackText` поле `generation Json?`. Миграция `bunx prisma migrate dev --name track_text_generation` из `server/`, папку миграции закоммитить вместе с кодом, `bun prisma generate`. Проверка: `bunx prisma migrate status` — «up to date», в миграции только `ADD COLUMN`

## 2. Сервер и GraphQL (контракт)

- [x] 2.1 `server/src/graphql/typeDefs.ts`: у `createTrackText` необязательный аргумент `generation: String`, у типа `TrackText` поле `generation: String`. Проверка: `bun run typecheck` в `server/`
- [x] 2.2 `server/src/modules/track-texts/track-texts.service.ts`: в `createTrackText` принять `generation`, разобрать JSON, отвергнуть не-объект и размер больше ~8 КБ с сообщением по-русски, сохранить в колонку; в ответ вернуть строкой или `null`. Проверка: тест в `track-texts.service.test.ts` — с настройками сохраняются и читаются, без них `null`, мусор и слишком большой отвергаются, чужой текст по-прежнему не читается
- [x] 2.3 `server/src/graphql/ai.resolvers.ts`: проброс `generation` в сервис и в DTO текста. Проверка: `bun run ci` в `server/` зелёный

## 3. Клиент: сохранить настройки

- [x] 3.1 `client/src/features/catalog-assemble/api/ai-queries.ts`: `generation` в `CREATE_TRACK_TEXT`. Проверка: `bun run typecheck` в `client/`
- [x] 3.2 `client/src/features/catalog-assemble/ui/collage-rewrite-panel.tsx` и `catalog-assemble-panel.tsx`: принять форму трека, сериализовать `{ form, hideAdlibs, filters }` при «Сохранить в тексты»; «Открыть как текст для правки» `generation` не передаёт. Проверка: руками в браузере — после сохранения текст в базе с настройками, после открытия из избранного без них

## 4. Клиент: сводка и «Применить в генератор»

- [x] 4.1 `client/src/features/track-texts/lib/generation.ts`: разбор строки в настройки (`unknown` + сужение, значения по умолчанию, не объект → `null`) и функция сводки (форма, адлибы, активные фильтры, «фильтров нет»). Проверка: unit-тест на корректные, частичные и мусорные данные
- [x] 4.2 `client/src/features/track-texts/api/queries.ts` и `ui/track-text-view.tsx`: запросить `generation`, показать сводку, кнопка-иконка «Применить в генератор» с подсказкой (`Hint`); у текстов без настроек — ни сводки, ни кнопки. Проверка: руками — старый текст без сводки, свежий со сводкой
- [x] 4.3 `client/src/widgets/catalog-menu/ui/catalog-menu.tsx`: колбэк `onApplySettings` → `setGeneratorForm` + `writeGeneratorForm`, `setHideAdlibs`, `setGeneratorFilters`; закрыть текст, тост «Настройки возвращены в генератор». Проверка: руками — применить, панель генератора показывает форму, адлибы и фильтры из текста, склейка не пересобрана, текст не изменился

## 5. Интеграция

- [x] 5.1 Сквозной сценарий в браузере: собрать с формой, адлибами и тегом → «Поправить ИИ» → сохранить → поменять панель → открыть текст → сводка верна → «Применить» → панель вернулась. Затем `bun run fix` в `client/` и `server/` (lint, prettier, typecheck без warnings)
- [x] 5.2 `docs/status.md` и `docs/tasks/current_task.md`: строка про настройки генерации в текстах. Проверка: строки на месте

## Workflow follow-up

- После `/opsx:archive`: проверить, нужен ли апп MINOR по правилу из CLAUDE.md (change ощутимый — один апп на заход).
