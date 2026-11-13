## 1. Схема (Prisma)

- [x] 1.1 `server/prisma/schema.prisma`: значение `SCRATCH` в `enum AiUsageKind`; миграция `ai_usage_scratch` (`migrate dev --create-only`, только `ALTER TYPE … ADD VALUE`), применить на `dope-lyrics-db`, `bun prisma generate`

## 2. Подбор эталонов (server)

- [x] 2.1 `server/src/modules/ai/artists/pick.ts`: экспортировать `scoreSample`, поведение «Поправить ИИ» не меняется (`pick.test.ts` зелёный)
- [x] 2.2 `server/src/modules/ai/scratch/pick.ts`: `scratchExcerpt(text)` — снять ведущие заглушки (пустые после скобок, метки частей, междометия до трёх слов), 24 строки; `hasLink(text)` — регулярка связи из design
- [x] 2.3 `scratch/pick.ts`: `pickScratchReferences(pool, { facets, theme, random })` — выбранные тексты первыми без проверок, остальные по `scoreSample` с пустой ролью, фильтр связи (выключен, если связь в теме), группы по счёту с перемешиванием, один текст на артиста, до трёх
- [x] 2.4 `scratch/pick.test.ts` на фикстурах: отрывок без «Yeah» / «(Ай-ай)» / `[Intro]`; текст со звонком отброшен и не отброшен при связи в теме; выбранный текст со звонком идёт; без граней — случайная выборка с фиксированным `random`; одинаковый счёт перемешивается; артист без текстов не занимает место; два выбранных текста одного артиста идут оба; пустая полка — пустой список
- [x] 2.5 Тест на локальной полке не пишем; долю отсечённых связью текстов перепроверить скриптом из 5.1 с `--pick` — 46 из 342 (13%), 13.11

## 3. Рамка и запрос (server)

- [x] 3.1 `server/src/modules/ai/scratch/frame.ts`: `SCRATCH_FRAME_VERSION = '1.0.0'`, рамка Explore из design (черновик), `buildScratchSystem()`
- [x] 3.2 `scratch/request.ts`: `formatScratchForm(quotas)` по `TRACK_FRAME` (пропуск нулевых квот, второй хук — «тот же», подписи как `ROLE_LABELS`); вводная к эталонам и `formatScratchReferences` (отрывок, пояснение при наличии); `buildScratchUser({ theme, authorPrompt, references, form })` через `contextBlocks` из `rewrite/request.ts`
- [x] 3.3 `scratch/request.test.ts`: в запросе тема, портрет, эталоны, форма «Хит» и «Холст»; без эталонов блока нет; пустой портрет не даёт блока
- [x] 3.4 `scratch/scratch.service.ts`: `buildScratchRequest(userId, input, promptOverride?)` (пустая тема → «Тема не может быть пустой», `keepKnown` для граней, `parseTrackFormQuotas`, `loadArtistPool`, `getCurrentPrompt`); `writeFromScratch(userId, input)` через `callModel` с `kind: 'SCRATCH'`, `SCRATCH_FRAME_VERSION`, `env.AI_MAX_TOKENS`, разбор `stripModelWrapper`, пустой ответ — ошибка; возвращает `aiText`, `usageId`, `references`
- [x] 3.5 `scratch/scratch.service.test.ts` с подменой `polza.client`: один вызов на запрос, в user нет текста фраз каталога, запись `AiUsage` с видом `SCRATCH` и при ошибке провайдера

## 4. Тексты и GraphQL-контракт (server)

- [x] 4.1 `server/src/modules/track-texts/track-texts.service.ts`: `createScratchTrackText(userId, { theme, aiText, usageId, generation })` — `slots = []`, `sourceText = ''`, проверка темы, ответа и `usageId` владельца; тест: создание, открытие, правка, «Готово», удаление такого текста
- [x] 4.2 GraphQL-контракт: `input ScratchFacetsInput`, типы `ScratchReference`, `ScratchResult`, мутации `writeFromScratch(theme, form, facets, references)` и `createScratchTrackText(theme, aiText, usageId, generation)` в `server/src/graphql/typeDefs.ts`; резолверы под `requireAi` в `server/src/graphql/ai.resolvers.ts` (и в резолверах текстов — там, где `createTrackText`)
- [x] 4.3 Тест резолвера: пользователь не `OWNER` получает ошибку по-русски на обе мутации

## 5. Прогоны (server, без polza)

- [x] 5.1 `server/prisma/script/scratch-probe.ts` и скрипт `ai:scratch` в `server/package.json`: `--themes`, `--pick`, `--dry`, `--prompt`, `--no-references`, `--artist`, `--text`, `--label`, `-n`; вывод в `server/.ai-probe/scratch/`; без `--dry` / `--pick` вызывает polza — только по слову автора
- [x] 5.2 `server/.ai-probe/scratch/themes.json` (вне git): шесть тем из куплетов автора с гранями прогона 13.11
- [x] 5.3 ~~Прогон подбора трёх текстов на пометку автора~~ — снято 13.11: вариант А заменён вариантом Б, подбор кусков — 9.5
- [x] 5.4 ~~Прогон рамки Explore чатом~~ — снято 13.11: черновики 1.1.0 не сошлись, итог в `docs/research/from-scratch.md`; рамка «С нуля» — 9.6

## 6. Страница «С нуля» (client)

- [x] 6.1 `client/src/features/catalog-assemble/ui/catalog-generator-pane.tsx`: вынести форму трека (пресеты + `ParagraphField`) и `ReferenceFilterFields` в экспортируемые компоненты фичи, вид генератора не меняется; экспорт через `features/catalog-assemble/index.ts`
- [x] 6.2 `client/src/features/from-scratch/api/queries.ts`: `WRITE_FROM_SCRATCH`, `CREATE_SCRATCH_TRACK_TEXT` и типы ответа
- [x] 6.3 `client/src/features/from-scratch/ui/from-scratch-page.tsx`: тема (обязательна), чипсы граней по `shared/lib/lyric-facets` (`MultiSelect` — только числовые id), форма через `readGeneratorForm` / `writeGeneratorForm`, фильтры эталонов, «Написать» (недоступна без темы и без ИИ, с пояснением), ответ с метками, эталоны под ответом, «Ещё раз», «Сохранить в тексты» с `generation = { kind: 'scratch', form, facets, references, picked }`; ошибки по-русски, тема не теряется
- [x] 6.4 `client/src/widgets/catalog-menu/ui/catalog-menu.tsx`: секция `'from-scratch'`, пункт «С нуля» под «Генератором» только у владельца, своё состояние фильтров эталонов; после сохранения — переход к тексту или тост, как в генераторе

## 7. Тексты «С нуля» на клиенте

- [x] 7.1 `client/src/features/track-texts/lib/generation.ts`: разбор `kind: 'scratch'` в отдельный тип, сводка (форма, грани или «граней нет», эталоны без удалённых); тесты в `generation.test.ts`
- [x] 7.2 `client/src/features/track-texts/ui/track-text-view.tsx`: у текста «С нуля» нет вкладки «Из моих» и «Применить в генератор», шов без жёлтого (источником шва и вкладки «ИИ» идёт сам ответ ИИ); сводка «С нуля»
- [x] 7.3 `client/src/features/ai-settings/ui/usage-tab.tsx`: подпись `SCRATCH` — «С нуля»

## 8. Проверка и доки

- [x] 8.1 `bun run fix` в `server/` и `client/`, тесты сервера зелёные
- [ ] 8.2 После группы 9: автор проверяет страницу в браузере на polza: «Написать», «Ещё раз», «Сохранить в тексты», текст в «Текстах», запись «С нуля» в «Расходах»
- [x] 8.3 `docs/ideas.md`: у карточки «Генерация «С нуля»» статус «в работе», ссылка на change `from-scratch`, закрытые вопросы (подбор, портрет, `sourceText`); `docs/journal.md`: «эталон даёт форму, тема — мир; подбор по миру приносит гаджеты» с цифрами прогона подбора
- [x] 8.4 Каждая законченная группа — свой коммит в `feat/from-scratch`, subject по-русски

## 9. Вариант Б: склейка из полки и пересборка

- [x] 9.1 `server/src/modules/ai/scratch/pick.ts`: `splitIntoChunks(text)` — абзацы по пустым строкам, длинные по 4 строки, хвост < 3 строк к предыдущему, без заглушек (`isFiller`), кусок < 3 строк не берётся; ключ дубля по нормализованному тексту. Подбор трёх текстов (`pickScratchReferences`) и отрывок (`scratchExcerpt`) удалить
- [x] 9.2 `scratch/pick.ts`: `pickScratchCollage(pool, { facets, theme, quotas, chosenTextIds, artistFilter, random })` — части по `TRACK_FRAME` и `paragraphsForRole`, второй хук — копия; `scoreSample` с ролью части; группы по счёту с перемешиванием; один кусок на текст, до двух на артиста (снято, если выбраны только артисты); выбранные тексты — хотя бы по куску, первыми; связь по куску; пусто — ошибка «На полке нет текстов для склейки»
- [x] 9.3 `scratch/pick.test.ts` на фикстурах: нарезка по абзацам и окнам, заглушки, хвост; форма «Хит» — 4 куска куплета и 1 хука, второй хук равен первому; куски части из разных текстов; лимит два на артиста и его снятие при фильтре артистов; хук из текста с ролью HOOK; кусок со звонком отброшен, кусок того же текста без звонка берётся; связь в теме; выбранный текст идёт и со связью; дубль совместного трека один раз; пустая полка — ошибка
- [x] 9.4 `scripts`: `prisma/script/scratch-probe.ts` — `--pick` печатает склейку (части, куски, источник, отметка связи) вместо трёх текстов; `--dry` — запрос варианта Б; флаг `--no-references` убрать
- [ ] 9.5 Прогон подбора без модели: `--pick -n 2` на шести темах и теме вызова 21; сверка с ручной склейкой `server/.ai-probe/scratch/t21-collage/collage.txt`; таблица кусков автору на пометку «годится / мимо»; итог по критерию из design — в `docs/research/from-scratch.md`. 14.11: грани «чувство + поза» (`t21-feel`) — автор: годится по двум склейкам; на девяти критерий выполнен в двух, обычно по теме 4 из 9
- [x] 9.6 `scratch/frame.ts`: `SCRATCH_FRAME_VERSION = '2.0.0'`, `buildScratchSystem()` из `COLLAGE_REWRITE_FRAME` с заменами из design (склейка из чужих строк, дословно ни одной, без пункта про дословную строку и про карточки); тест — каждая замена нашла свой пункт, рамка Explore 1.0.0 удалена
- [x] 9.7 `scratch/request.ts`: склейка → секции `buildRewriteUser` (метки `ROLE_LABELS`, `artists: []`, без блока эталонов); `formatScratchForm` и блок эталонов удалить; тесты в `request.test.ts`
- [x] 9.8 `scratch/close.ts`: `findCloseLines(answer, collage)` — нормализация, 4 слова подряд или доля общих слов ≥ 0,6; тест на примерах из прогона («факап / red flag» ловится, «твоя вина, полусладкая» — нет)
- [x] 9.9 `scratch/scratch.service.ts`: `buildScratchRequest` собирает склейку, `writeFromScratch` возвращает `aiText`, `usageId`, `sources`, `collage`, `close`; тесты сервиса — один вызов, вид `SCRATCH`, в запросе нет фраз каталога, пустая полка — ошибка без вызова
- [x] 9.10 GraphQL-контракт: `ScratchSource`, `ScratchCloseLine`, `ScratchResult { aiText, usageId, sources, collage, close }` вместо `ScratchReference` / `references` в `server/src/graphql/typeDefs.ts`; резолвер в `server/src/graphql/ai.resolvers.ts`; тест доступа остаётся зелёным
- [ ] 9.11 Прогон рамки чатом: `--dry` на тему 21 и две темы автора, ответы пишет агент, счётчики из design; итог — в `docs/research/from-scratch.md`
- [x] 9.12 `client/src/features/from-scratch/`: запрос под новый ответ; под ответом источники и кнопка-иконка «Склейка» с `Hint` (свёрнута по умолчанию); подсветка близких строк с исходной строкой и артистом по наведению; `picked` из `sources`
- [x] 9.14 Рамка «С нуля» 2.1.0 (`scratch/frame.ts`): перевод и калька чужой строки — та же дословная; с английского — одно слово, не фраза; имена, персонажи и отсылки чужого трека — не ядро; из чужой строки — устройство удара, предмет свой. Пункт «Ядро не переводи» заменить. Тест — новые пункты в рамке, старого нет
- [ ] 9.15 `scratch/close.ts`: близко ещё и при двух общих английских словах со строкой склейки или парой соседних; тест на строках из ответа по Travis Scott «TELEKINESIS» 14.11 («Storm и troopers шагают в мой сон» — близко, «Future трубит сквозь дым» — нет: одно слово-ядро разрешено)
- [ ] 9.13 `bun run fix` в `server/` и `client/`, тесты зелёные; каждая законченная задача — свой коммит в `feat/from-scratch`
