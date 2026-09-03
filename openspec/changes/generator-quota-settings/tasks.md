## 1. Сервер: квота из чисел

- [x] 1.1 В `server/src/modules/lyrics/track-assemble.ts` заменить `TRACK_QUOTAS` / `preset` на квоты абзацев `{ intro, verse, hook, bridge }`; `n === 0` — пустой слот, иначе ровно `n * 4` строк; убрать random по диапазону
- [x] 1.2 Тесты нулевой квоты и точного N в `server/src/modules/lyrics/track-assemble.test.ts`

## 2. GraphQL

- [x] 2.1 В `server/src/graphql/typeDefs.ts`: input `TrackFormQuotas`, `assembleTrack(form: TrackFormQuotas!)`; убрать аргумент `preset` и enum `TrackFormPreset`
- [x] 2.2 Прокинуть `form` в `server/src/graphql/resolvers.ts` и `server/src/modules/lyrics/lyrics.service.ts`; отрицательные числа — ошибка по-русски

## 3. Клиент: контракт и storage

- [x] 3.1 Типы и `ASSEMBLE_TRACK` в `client/src/entities/lyric`: `form` вместо `preset`; пресет HIT/CANVAS оставить только как клиентский тип
- [x] 3.2 Читать/писать `dope-lyrics.generator-form` (хелпер рядом с `catalog-assemble` или в `catalog-menu.tsx`); битый JSON → хит

## 4. UI фильтра

- [x] 4.1 Поля куплет/хук, «Показать ещё» / «Скрыть» для интро и бриджа, пресеты подставляют числа — `client/src/features/catalog-assemble/ui/catalog-generator-pane.tsx`
- [x] 4.2 Состояние формы, запись в storage, `assemble({ form })` — `client/src/widgets/catalog-menu/ui/catalog-menu.tsx` и `client/src/features/catalog-assemble/ui/catalog-assemble-panel.tsx`

## 5. Проверка

- [x] 5.1 `bun run typecheck` в `server/` и `client/`
