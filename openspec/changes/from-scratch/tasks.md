## 1. Схема (Prisma)

- [ ] 1.1 `server/prisma/schema.prisma`: значение `SCRATCH` в `enum AiUsageKind`; миграция `ai_usage_scratch` (`migrate dev --create-only`, только `ALTER TYPE … ADD VALUE`), применить на `dope-lyrics-db`, `bun prisma generate`

## 2. Подбор эталонов (server)

- [ ] 2.1 `server/src/modules/ai/artists/pick.ts`: экспортировать `scoreSample`, поведение «Поправить ИИ» не меняется (`pick.test.ts` зелёный)
- [ ] 2.2 `server/src/modules/ai/scratch/pick.ts`: `scratchExcerpt(text)` — снять ведущие заглушки (пустые после скобок, метки частей, междометия до трёх слов), 24 строки; `hasLink(text)` — регулярка связи из design
- [ ] 2.3 `scratch/pick.ts`: `pickScratchReferences(pool, { facets, theme, random })` — выбранные тексты первыми без проверок, остальные по `scoreSample` с пустой ролью, фильтр связи (выключен, если связь в теме), группы по счёту с перемешиванием, один текст на артиста, до трёх
- [ ] 2.4 `scratch/pick.test.ts` на фикстурах: отрывок без «Yeah» / «(Ай-ай)» / `[Intro]`; текст со звонком отброшен и не отброшен при связи в теме; выбранный текст со звонком идёт; без граней — случайная выборка с фиксированным `random`; одинаковый счёт перемешивается; артист без текстов не занимает место; два выбранных текста одного артиста идут оба; пустая полка — пустой список
- [ ] 2.5 Тест на локальной полке не пишем; долю отсечённых связью текстов (15% на 13.11) перепроверить скриптом из 5.1 с `--pick`

## 3. Рамка и запрос (server)

- [ ] 3.1 `server/src/modules/ai/scratch/frame.ts`: `SCRATCH_FRAME_VERSION = '1.0.0'`, рамка Explore из design (черновик), `buildScratchSystem()`
- [ ] 3.2 `scratch/request.ts`: `formatScratchForm(quotas)` по `TRACK_FRAME` (пропуск нулевых квот, второй хук — «тот же», подписи как `ROLE_LABELS`); вводная к эталонам и `formatScratchReferences` (отрывок, пояснение при наличии); `buildScratchUser({ theme, authorPrompt, references, form })` через `contextBlocks` из `rewrite/request.ts`
- [ ] 3.3 `scratch/request.test.ts`: в запросе тема, портрет, эталоны, форма «Хит» и «Холст»; без эталонов блока нет; пустой портрет не даёт блока
- [ ] 3.4 `scratch/scratch.service.ts`: `buildScratchRequest(userId, input, promptOverride?)` (пустая тема → «Тема не может быть пустой», `keepKnown` для граней, `parseTrackFormQuotas`, `loadArtistPool`, `getCurrentPrompt`); `writeFromScratch(userId, input)` через `callModel` с `kind: 'SCRATCH'`, `SCRATCH_FRAME_VERSION`, `env.AI_MAX_TOKENS`, разбор `stripModelWrapper`, пустой ответ — ошибка; возвращает `aiText`, `usageId`, `references`
- [ ] 3.5 `scratch/scratch.service.test.ts` с подменой `polza.client`: один вызов на запрос, в user нет текста фраз каталога, запись `AiUsage` с видом `SCRATCH` и при ошибке провайдера

## 4. Тексты и GraphQL-контракт (server)

- [ ] 4.1 `server/src/modules/track-texts/track-texts.service.ts`: `createScratchTrackText(userId, { theme, aiText, usageId, generation })` — `slots = []`, `sourceText = ''`, проверка темы, ответа и `usageId` владельца; тест: создание, открытие, правка, «Готово», удаление такого текста
- [ ] 4.2 GraphQL-контракт: `input ScratchFacetsInput`, типы `ScratchReference`, `ScratchResult`, мутации `writeFromScratch(theme, form, facets, references)` и `createScratchTrackText(theme, aiText, usageId, generation)` в `server/src/graphql/typeDefs.ts`; резолверы под `requireAi` в `server/src/graphql/ai.resolvers.ts` (и в резолверах текстов — там, где `createTrackText`)
- [ ] 4.3 Тест резолвера: пользователь не `OWNER` получает ошибку по-русски на обе мутации

## 5. Прогоны (server, без polza)

- [ ] 5.1 `server/prisma/script/scratch-probe.ts` и скрипт `ai:scratch` в `server/package.json`: `--themes`, `--pick`, `--dry`, `--prompt`, `--no-references`, `--artist`, `--text`, `--label`, `-n`; вывод в `server/.ai-probe/scratch/`; без `--dry` / `--pick` вызывает polza — только по слову автора
- [ ] 5.2 `server/.ai-probe/scratch/themes.json` (вне git): шесть тем из куплетов автора с гранями прогона 13.11
- [ ] 5.3 Прогон подбора `--pick -n 3`: таблица эталонов по темам автору на пометку «годится / мимо»; итог и вывод по критерию из design — в `docs/research/from-scratch.md`
- [ ] 5.4 Прогон рамки чатом: `--dry` на шесть тем × (с эталонами / без) × (с портретом / без), ответы пишет агент; счётчики из design; правки рамки — только по повторяющейся поломке, с подъёмом версии; итог — в `docs/research/from-scratch.md`

## 6. Страница «С нуля» (client)

- [ ] 6.1 `client/src/features/catalog-assemble/ui/catalog-generator-pane.tsx`: вынести форму трека (пресеты + `ParagraphField`) и `ReferenceFilterFields` в экспортируемые компоненты фичи, вид генератора не меняется; экспорт через `features/catalog-assemble/index.ts`
- [ ] 6.2 `client/src/features/from-scratch/api/queries.ts`: `WRITE_FROM_SCRATCH`, `CREATE_SCRATCH_TRACK_TEXT` и типы ответа
- [ ] 6.3 `client/src/features/from-scratch/ui/from-scratch-page.tsx`: тема (обязательна), три `MultiSelect` граней по `shared/lib/lyric-facets`, форма через `readGeneratorForm` / `writeGeneratorForm`, фильтры эталонов, «Написать» (недоступна без темы и без ИИ, с пояснением), ответ с метками, эталоны под ответом, «Ещё раз», «Сохранить в тексты» с `generation = { kind: 'scratch', form, facets, references, picked }`; ошибки по-русски, тема не теряется
- [ ] 6.4 `client/src/widgets/catalog-menu/ui/catalog-menu.tsx`: секция `'from-scratch'`, пункт «С нуля» под «Генератором» только у владельца, своё состояние фильтров эталонов; после сохранения — переход к тексту или тост, как в генераторе

## 7. Тексты «С нуля» на клиенте

- [ ] 7.1 `client/src/features/track-texts/lib/generation.ts`: разбор `kind: 'scratch'` в отдельный тип, сводка (форма, грани или «граней нет», эталоны без удалённых); тесты в `generation.test.ts`
- [ ] 7.2 `client/src/features/track-texts/ui/track-text-view.tsx`: у текста «С нуля» нет вкладки «Из моих» и «Применить в генератор», шов без жёлтого (`lib/seam.ts` с пустым источником); сводка «С нуля»
- [ ] 7.3 `client/src/features/ai-settings/ui/usage-tab.tsx`: подпись `SCRATCH` — «С нуля»

## 8. Проверка и доки

- [ ] 8.1 `bun run fix` в `server/` и `client/`, тесты сервера зелёные
- [ ] 8.2 Автор проверяет страницу в браузере на polza: «Написать», «Ещё раз», «Сохранить в тексты», текст в «Текстах», запись «С нуля» в «Расходах»
- [ ] 8.3 `docs/ideas.md`: у карточки «Генерация «С нуля»» статус «в работе», ссылка на change `from-scratch`, закрытые вопросы (подбор, портрет, `sourceText`); `docs/journal.md`: «эталон даёт форму, тема — мир; подбор по миру приносит гаджеты» с цифрами прогона подбора
- [ ] 8.4 Каждая законченная группа — свой коммит в `feat/from-scratch`, subject по-русски
