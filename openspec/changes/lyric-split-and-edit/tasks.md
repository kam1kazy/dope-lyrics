## 1. Сервер: текст и разрез

- [x] 1.1 Хелперы разреза строк и пересчёта счётчиков/готовности в `server/src/modules/lyrics/` (рядом с `parse/text-utils.ts` и `readinessFromLineCount`)
- [x] 1.2 `updateLyricText` и `splitLyric` в `server/src/modules/lyrics/lyrics.service.ts`: пустые половины и пустой trim — ошибка по-русски; низ копирует теги/профиль/полки/`lyric_id`, не копирует медиа и реакции
- [x] 1.3 Контракт GraphQL в `server/src/graphql/typeDefs.ts`: `updateLyricText`, `splitLyric`, `SplitLyricPayload`; резолверы в `server/src/graphql/resolvers.ts`

## 2. Клиент: кэш и запросы

- [x] 2.1 Мутации в `client/src/entities/lyric/api/queries.ts`; реэкспорт из `client/src/entities/lyric/index.ts`
- [x] 2.2 Обновление текста и вставка нижней фразы в `client/src/entities/lyric/lib/update-lyrics-cache.ts`

## 3. Карточка

- [x] 3.1 Режим разреза в `client/src/features/message-desk/ui/message-desk-dialog.tsx`: пунктир, ножницы, «Разрезать», отмена, диалог выбора части
- [x] 3.2 Прокинуть выбранную фразу после разреза из стола в `client/src/widgets/lyric-list/ui/viewport.tsx` и `client/src/features/catalog-lyrics-list/ui/catalog-lyrics-list.tsx`
- [x] 3.3 Правка: двойной тап, textarea, галка/крестик, диалог грязного выхода (существующий Dialog)

## 4. Проверка

- [x] 4.1 `bun run typecheck` в `server/` и `client/`
