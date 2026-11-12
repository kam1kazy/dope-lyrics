## 1. Схема и перенос карточек (Prisma)

- [x] 1.1 `server/prisma/schema.prisma`: enum `TechniqueKind`, модели `Artist`, `ArtistTechnique`, `ReferenceText`, связь `Users.artists`, значения `AiUsageKind` `ARTIST_CARD` и `REFERENCE_TAGS`
- [x] 1.2 Миграция `reference_shelf`: `migrate dev --create-only`, дописать вставку 26 стартовых карточек владельцам (`role = 'OWNER'`), SQL сгенерирован из `profiles.ts` + `techniques.ts`; применить на `dope-lyrics-db`
- [x] 1.3 Проверить на локальной базе: у владельца 26 артистов и столько же приёмов, сколько в коде; `bun prisma generate`

## 2. Подбор из базы (server)

- [x] 2.1 `server/src/modules/ai/artists/`: типы `ArtistProfile`/`ArtistTechnique` без slug, удалить `ARTIST_PROFILES` и инструкции из `techniques.ts`, оставить `PICKED_KINDS` и `TechniqueKind`
- [x] 2.2 `pick.ts`: `rankArtistCandidates(artists, facets)` по переданному списку; `pickReferenceTexts` (оценка по роли, настроению, энергии, подаче; переиспользование; лимит 3)
- [x] 2.3 Тесты `pick.test.ts` на фикстурах: три вида на часть, разброс при пустых гранях, выбор текста по тегам, один текст один раз, лимит 3, артист без текстов
- [x] 2.4 `modules/ai/artists/load.ts`: загрузка артистов пользователя с приёмами и текстами и разбор фильтра `references` (пул, тексты артиста, чужие id отброшены); тест на разбор фильтра

## 3. Эталоны в запросе «Поправить ИИ» (server)

- [x] 3.1 `rewrite/request.ts`: блок эталонов перед склейкой, подпись `Артист · эталон N`, ярлык вместо slug, обрезка до 24 строк; тесты в `request.test.ts`
- [x] 3.2 `rewrite/rewrite.service.ts`: артисты из базы, фильтр `references`; `FRAME_VERSION` → `2.1.0` в `frame.ts`
- [x] 3.3 `prisma/script/ai-probe.ts`: работает с артистами из базы (флаги `--artists`, `--texts` для фильтра)
- [x] 3.4 GraphQL: `input ReferenceFilterInput`, аргумент `references` у `rewriteCollage` (`typeDefs.ts`, `ai.resolvers.ts`)

## 4. Полка: сервис и GraphQL (server)

- [x] 4.1 `modules/references/references.service.ts`: CRUD артистов и текстов по `userId`, проверка граней и видов, лимит пяти приёмов, «Такой артист уже есть», сброс тегов при смене текста
- [x] 4.2 Тесты сервиса: изоляция по пользователю, повтор имени, лимит приёмов, сброс тегов, каскадное удаление
- [x] 4.3 GraphQL-контракт полки: типы `Artist`, `ArtistTechnique`, `ReferenceText`, `ArtistCardDraft`, запросы `artists`, `artist`, мутации из design; всё под `requireAi`

## 5. ИИ полки (server)

- [x] 5.1 `model/polza.client.ts` и `model/model-call.ts`: необязательный `webSearch: { query }` → `plugins: [{ id: 'web', ... }]`; тест на тело запроса
- [x] 5.2 `ai/references/card.ts`: черновик карточки (поиск, тексты артиста, разбор с отбрасыванием неизвестного); тесты разбора
- [x] 5.3 `ai/references/tags.ts`: теги текста; тесты разбора; мутации `draftArtistCard`, `tagReferenceText`
- [x] 5.4 `bun run fix` и `bun test` в `server/`

## 6. Экран «Эталоны» (client)

- [x] 6.1 `features/reference-shelf/api/queries.ts`: запросы и мутации полки, типы
- [x] 6.2 Список артистов: имя, число текстов, «Добавить артиста», пустое состояние, ошибки по-русски
- [x] 6.3 Карточка: форма имени, граней (`FacetChipGroup`), приёмов (вид, ярлык, инструкция, до пяти), «Заполнить с ИИ» в черновик, «Сохранить», удаление артиста с подтверждением
- [x] 6.4 Тексты: список, диалог добавить/изменить (название, текст, теги), удаление, теги ИИ после сохранения и «Поставить теги» при ошибке
- [x] 6.5 Пояснение: кнопка `MessageCircle` (закрашена, если есть), модалка правки
- [x] 6.6 `widgets/catalog-menu`: пункт «Эталоны» включён для владельца, раздел `references`
- [x] 6.7 `features/ai-settings`: подписи «Карточка артиста», «Теги эталона»

## 7. Фильтры эталонов в генераторе (client)

- [x] 7.1 `shared/ui/multi-select`: мультиселект на `Popover` с группами
- [x] 7.2 `CatalogGeneratorPane`: блок «Эталоны» с мультиселектами «Артисты» и «Тексты»; состояние `generatorReferences` в `catalog-menu.tsx`, точка у фильтров
- [x] 7.3 `CollageRewritePanel`: `references` в `rewriteCollage` и в `generation` при сохранении
- [x] 7.4 `features/track-texts/lib/generation.ts`: поле `references`, сводка по именам, применение с отбросом удалённых; тесты в `generation.test.ts`
- [x] 7.5 `bun run fix` в `client/`

## 8. Проверка и доки

- [x] 8.1 Живой прогон через GraphQL на локальном сервере и живой модели: артист, повтор имени, ИИ-черновик с поиском, сохранение карточки, текст, теги ИИ, пояснение, «Поправить ИИ» с фильтром, сохранение текста с эталонами; тестовые данные удалены
- [x] 8.1b Проверка в браузере автором: экран «Эталоны», мультиселекты в генераторе, сводка и «Применить» (браузерного инструмента у агента не было)
- [x] 8.2 `ai:probe` на склейке до и после: карточки на месте, эталоны в запросе
- [x] 8.3 `docs/status.md`, `docs/tasks/current_task.md`, `docs/ideas.md` (статус карточки), journal — по итогам

## 9. Правки автора после первого показа (12.11.2026)

- [x] 9.1 Артист открывается третьим уровнем справа (как фильтры), вкладки «Тексты» (первая) и «Настройки» (`ui/artist-pane.tsx`, `catalog-menu.tsx`)
- [x] 9.2 Краткие описания к полям приёма: вид, ярлык, инструкция
- [x] 9.3 Ещё 23 артиста с карточками от «Заполнить с ИИ» — миграция `reference_shelf_more_artists` (пропускает тех, кто уже есть по имени)
- [x] 9.4 Ссылки-источники из поиска срезаются из карточки, рамка карточки 1.0.2
