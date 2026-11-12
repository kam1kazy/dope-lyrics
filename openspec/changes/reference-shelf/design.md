## Context

Сейчас карточки артистов — константы: `server/src/modules/ai/artists/profiles.ts` (26 артистов, грани, ярлыки приёмов) и `techniques.ts` (инструкции и вид приёма по id). `pick.ts` ранжирует `ARTIST_PROFILES` по граням части и берёт по одному приёму образа, звука и игры слов (`pickByKind`). `rewrite/request.ts` печатает карточки под частью склейки. Настоящих чужих текстов в запросе нет.

ИИ доступен только владельцу (`ai:use`). Модель вызывается через `callModel` (`model/model-call.ts`) с записью в `AiUsage`. Провайдер polza — OpenAI-совместимый. Поиск в интернете включается полем `plugins: [{ id: "web", search_prompt, max_results }]` в `/chat/completions`. Ответ — обычный текст, источники приходят в `annotations` (нам не нужны). Поиск стоит 0,50 ₽. polza советует не совмещать поиск с `response_format`, поэтому JSON разбираем из текста, как в `ai-prompt-meta.ts`.

Настройки генерации в тексте (`TrackText.generation`) сервер хранит как непрозрачный JSON. Разбирает их клиент (`features/track-texts/lib/generation.ts`).

## Goals / Non-Goals

**Goals:**
- Перенести карточки артистов в базу пользователя без смены поведения подбора.
- Дать полку: артисты → карточка + тексты, правка руками и через ИИ.
- Класть в запрос «Поправить ИИ» по одному тексту подобранного артиста с пояснением.
- Жёсткий фильтр эталонов в генераторе и его память в тексте.

**Non-Goals:** см. proposal: портреты, свои эталоны, доступ не владельцу, «Внести правки».

## Decisions

### 1. Схема: три модели и enum

```prisma
enum TechniqueKind { IMAGE SOUND WORDPLAY TONE }

model Artist {
  id        Int      @id @default(autoincrement())
  name      String
  moods     String[] @default([])
  energies  String[] @default([])
  deliveries String[] @default([])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    Int
  owner     Users    @relation(..., onDelete: Cascade)
  techniques ArtistTechnique[]
  texts      ReferenceText[]
  @@unique([userId, name])
}

model ArtistTechnique {
  id          Int           @id @default(autoincrement())
  kind        TechniqueKind
  label       String
  instruction String
  position    Int
  artistId    Int  // onDelete: Cascade
  @@index([artistId, position])
}

model ReferenceText {
  id        Int       @id @default(autoincrement())
  title     String?
  text      String
  note      String?
  mood      String[]  @default([])
  delivery  String[]  @default([])
  songRole  String[]  @default([])
  energy    String?
  taggedAt  DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  artistId  Int       // onDelete: Cascade
  @@index([artistId, createdAt])
}
```

- Грани хранятся строками, как у `Lyrics` (`mood`, `delivery`, `energy`). Словари те же — `lyric-facets.ts`. Новых enum под грани не заводим.
- Приём — отдельная строка, а не JSON в артисте. Его правят по одному, у него порядок, а `kind` проверяет база.
- Slug приёма (`numb-longing`) не переносим. В запросе вместо slug печатаем ярлык: модель не выбирает id, slug был только подписью.
- Текст привязан к артисту. Владельца берём через `artist.userId`, отдельный `userId` у текста не нужен.
- `@@unique([userId, name])` защищает от повтора имени. Регистр учитывается: «future» и «Future» — разные строки. ИИ всё равно приводит имя к написанию на площадках.
- `taggedAt = null` значит «теги не ставились»: по нему UI показывает «Поставить теги».
- Альтернатива — флаг у `Lyrics`, как прикидывал ADR 0006. Отвергнута: у `Lyrics` чат, `lyric_id`, карусель, аналитика, и чужие тексты пришлось бы вычищать из каждой выборки.

### 2. Перенос 26 карточек миграцией

SQL-миграция вставляет артистов и приёмы для каждого `Users` с `role = 'OWNER'`: `INSERT … SELECT … FROM "Users" WHERE role = 'OWNER'`. SQL генерируется один раз скриптом из нынешних `profiles.ts` + `techniques.ts` и коммитится как миграция. Сам скрипт в репозиторий не идёт. Миграция выполняется один раз (её помечает `_prisma_migrations`), повторной вставки нет. Владельца, созданного после миграции (чистая база, seed), стартовые карточки не догоняют. Это принято: на проде владелец уже есть, локально база проекта тоже с владельцем.

После миграции `ARTIST_PROFILES` и инструкции из `techniques.ts` удаляются. Остаются типы, `PICKED_KINDS` и подписи видов.

Альтернатива — ленивый посев в коде при первом открытии полки. Отвергнута: нужен флаг «уже сеяли», иначе удаление всех артистов их вернёт.

### 3. Подбор: чистые функции над данными из базы

`artists/pick.ts` перестаёт читать константу:
- `rankArtistCandidates(artists, facets)` — та же логика (оценка, разброс при пустых гранях, `pickByKind`), но по переданному списку.
- Новая `pickReferenceTexts(sections, options)`: для каждой части и каждого её артиста выбирает текст с лучшей оценкой. Оценка: совпадение роли части ×2, пересечение настроений ×2, энергия, пересечение подачи — веса как у `scoreArtist`. При равенстве — первый по `createdAt desc`, без случайности: прогоны `ai:probe` воспроизводимы. Текст уже выбран раньше — переиспользуется. Лимит `REFERENCE_TEXT_LIMIT = 3` на запрос: когда он исчерпан, новые артисты идут без текста.
- Загрузку делает `rewrite.service.ts`: один запрос артистов пользователя с приёмами (по `position`) и текстами.

Фильтр `references: { artistIds, textIds }` (оба необязательны):
- пул артистов — все, если оба пусты, иначе `artistIds ∪ artist(textIds)`;
- тексты артиста — выбранные из `textIds`, если у него такие есть, иначе все;
- чужие и несуществующие id отбрасываются запросом `where: { userId }`.

Если фильтр задан, но после отбрасывания пул пуст, карточек в запросе нет. Подменять это всей полкой нельзя: так нарушится «жёсткий».

### 4. Запрос «Поправить ИИ», рамка 2.1.0

Блок эталонов идёт перед склейкой, после темы и промпта автора:

```
Эталоны — тексты артистов, которые любит автор. Смотри, как сделаны подача, звук и образ. Строки не копируй и не пересказывай.

Эталон 1 · Future — «Mask Off»
<до 24 строк>
Чем нравится автору: <пояснение>
```

В карточках под частью артист с текстом подписан `Future · эталон 1`, строка приёма — `- образ · <ярлык>: <инструкция>`. Системная рамка не меняется. `FRAME_VERSION` → `2.1.0`: MINOR, потому что поменялось содержимое запроса (так велит комментарий в `frame.ts`). Без текстов на полке запрос отличается от 2.0.0 только ярлыком вместо slug.

### 5. Поиск в интернете в клиенте polza

У `completeWithModel` и `callModel` появляется необязательный параметр `webSearch?: { query: string }`. Если он есть, в тело запроса добавляется `plugins: [{ id: 'web', search_prompt: query, max_results: 5 }]`. `search_prompt` задаём сами: по умолчанию polza искала бы по всему сообщению с инструкциями. Ответ разбирается как обычно, `annotations` игнорируем. Цена поиска не входит в токены: polza отдаёт её в `usage.plugins.web.total_cost_rub`, она прибавляется к `costRub` вызова.

### 6. Этапы ИИ полки — своя папка `ai/references/`

- `card.ts` — черновик карточки: system просит JSON `{name, moods, energies, deliveries, techniques: [{kind, label, instruction}]}`, до пяти приёмов, словари перечислены в system. В user — имя и до трёх текстов артиста (по 16 строк). Поиск — `«<имя>» рэп артист стиль подача тексты`. Разбор: zod + отбрасывание неизвестных граней и видов, обрезка до пяти приёмов. Вид `ARTIST_CARD`, версия `ARTIST_CARD_FRAME_VERSION = '1.0.1'` (1.0.1 — имя брать из результатов поиска: без этого модель оставляла написание автора), `maxTokens` 1500.
- `tags.ts` — теги текста: JSON `{mood, delivery, songRole, energy}` из словарей, без поиска. Вид `REFERENCE_TAGS`, `REFERENCE_TAGS_FRAME_VERSION = '1.0.0'`, `maxTokens` 300. Текст в запросе — до 60 строк.

### 7. Модуль `modules/references/` и GraphQL

`references.service.ts` — CRUD по `userId`: `listArtists`, `getArtist`, `createArtist(name)`, `updateArtist(id, {name, moods, energies, deliveries, techniques})` (приёмы заменяются целиком в транзакции), `deleteArtist`, `createReferenceText`, `updateReferenceText` (если сменился `text`, теги сбрасываются: `taggedAt = null`), `deleteReferenceText`, `saveReferenceTags`. Проверка граней — через `lyric-facets.ts` (`isLyricMood` и т. п.), ошибки по-русски. Повтор имени (`P2002`) → «Такой артист уже есть».

GraphQL — в `typeDefs.ts` и `ai.resolvers.ts` под `requireAi`:

```graphql
enum TechniqueKind { IMAGE SOUND WORDPLAY TONE }
type ArtistTechnique { id: Int! kind: TechniqueKind! label: String! instruction: String! }
type ReferenceText { id: Int! artistId: Int! title: String text: String! note: String
  mood: [String!]! delivery: [String!]! songRole: [String!]! energy: String tagged: Boolean! createdAt: String! }
type Artist { id: Int! name: String! moods: [String!]! energies: [String!]! deliveries: [String!]!
  techniques: [ArtistTechnique!]! texts: [ReferenceText!]! textCount: Int! }
type ArtistCardDraft { name: String! moods: [String!]! energies: [String!]! deliveries: [String!]! techniques: [ArtistTechniqueDraft!]! }

query  artists: [Artist!]!            # с текстами (id, title) — для фильтров и сводки
query  artist(id: Int!): Artist!
mutation createArtist(name: String!): Artist!
mutation updateArtist(id: Int!, input: ArtistInput!): Artist!
mutation deleteArtist(id: Int!): Boolean!
mutation draftArtistCard(id: Int!, name: String!): ArtistCardDraft!
mutation createReferenceText(artistId: Int!, title: String, text: String!): ReferenceText!
mutation updateReferenceText(id: Int!, input: ReferenceTextInput!): ReferenceText!
mutation deleteReferenceText(id: Int!): Boolean!
mutation tagReferenceText(id: Int!): ReferenceText!
rewriteCollage(..., references: ReferenceFilterInput)
input ReferenceFilterInput { artistIds: [Int!] textIds: [Int!] }
```

`draftArtistCard` принимает `name` из формы: автор мог поправить имя до нажатия. Тексты берёт у артиста `id`.

### 8. Клиент

- `features/reference-shelf/`: `api/queries.ts`, `ui/artist-list.tsx` (основная колонка раздела), `ui/artist-pane.tsx` (третий уровень — боковая панель, как фильтры: вкладки «Тексты» и «Настройки»; `selectedArtistId` живёт в `catalog-menu.tsx`), `ui/artist-card-form.tsx`, `ui/reference-text-list.tsx`, `ui/reference-text-dialog.tsx`, `ui/reference-note-dialog.tsx`.
- Грани и теги правятся через `FacetChipGroup` (`toggleOnClick`) из `entities/lyric`, подписи — из `shared/lib/lyric-facets.ts`.
- Пояснение — `MessageCircle` из Lucide, закрашенное (`fill-current`) при непустом пояснении, `Hint` + `aria-label`.
- В `catalog-menu.tsx` у пункта `references` снимается `disabled`, раздел — только `isOwner`, как «Настройки ИИ». `CatalogMenuSection` получает `'references'`.
- Фильтр эталонов — отдельное состояние `generatorReferences: { artistIds, textIds }` рядом с `generatorFilters`: не смешиваем с `CatalogSectionFilters`, который общий для всех разделов. Мультиселекты — `shared/ui/multi-select` на `Popover` из kit: список с отметками, тексты сгруппированы по артисту. Точка «есть настройки» учитывает эталоны.
- `CollageRewritePanel` передаёт `references` в `rewriteCollage` и в `generation` при сохранении текста.
- `generation.ts`: `TrackTextGeneration.references` (по умолчанию пустые списки; старые тексты без поля разбираются как пустые). Сводка получает словарь `id → имя / название` из запроса `artists` и пропускает отсутствующие. «Применить» фильтрует id по живому списку.

## Risks / Trade-offs

- [Модель сочиняет образ редкого артиста] → поиск в интернете + тексты артиста в запросе, черновик не сохраняется без автора.
- [Длинные тексты раздувают запрос] → до 24 строк на эталон в «Поправить ИИ», не больше трёх эталонов, 60 строк — в тегах.
- [Миграция с данными сложнее обычной] → SQL сгенерирован из тех же констант. Тест сверяет число артистов и приёмов, а `ai:probe` до и после покажет ту же карточку под теми же частями (разница — ярлык вместо slug).
- [Порог 3 текста может быть мал] → константа, правится одной строкой после прогонов.
- [Поиск стоит денег] → только по кнопке, не при сохранении и не в «Поправить ИИ».

## Migration Plan

1. `prisma migrate dev --create-only` → дописать в SQL вставку стартовых карточек → применить локально на `dope-lyrics-db` (5433).
2. На проде миграция идёт через `prisma migrate deploy` в CI при выкатке `main`. Изменения аддитивные.
3. Откат: таблицы новые, код до change их не читает. Откат — выкатить прошлую версию. Таблицы можно оставить.

## Open Questions

Нет: решения автора от 12.11.2026 в `docs/ideas.md`.
