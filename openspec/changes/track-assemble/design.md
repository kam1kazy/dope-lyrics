## Context

После `lyric-facets` каталог хранит `songRole[]` / `roleProfiles` и сводку по кускам. Меню: список, избранное, демки, сводка; «История» и «Настройки ИИ» — заглушки в `catalog-menu.tsx`. Каркас сборки и лайк — первый кусок дорожки E без модели. См. proposal.md.

## Goals / Non-Goals

**Goals:**

- Случайная склейка на сервере из пулов по роли.
- Persist только лайкнутых склеек.
- Живой раздел «История» в меню.

**Non-Goals:**

- ИИ, ручные слоты, фильтр по настроению внутри сборки.
- KPI лайков в `catalogStats`.
- Telegram write-back.

## Decisions

### 1. Модель `LyricCollage`

Таблица: `id`, `createdAt`, `slots Json` — массив `{ songRole, lyricId: number | null }`. Без FK-каскада на Lyrics (удаление фразы не ломает историю; UI показывает «фраза удалена» при отсутствии). Seed/парсер не трогают.

Альтернатива нормализованных строк `LyricCollageSlot` — лишний join на MVP; JSON достаточно.

### 2. Каркас в коде

Константа `TRACK_FRAME = ['INTRO','VERSE','HOOK','VERSE','BRIDGE','HOOK']` в `server/src/modules/lyrics/track-assemble.ts` (зеркало подписей на клиенте). Менять каркас = одна константа + спека.

### 3. API

- `assembleTrack: AssembledTrack!` — не пишет в БД; для каждого слота берёт случайный id из пула `songRole has role`, `isCensored = false` (скрытые ок). Без повторов lyricId в ответе.
- `likeCollage(slots: [CollageSlotInput!]!): LyricCollage!` — валидация длины/ролей каркаса, insert.
- `lyricCollages: [LyricCollage!]!` — orderBy createdAt desc, слоты + текст lyric при наличии.

Сервис: методы в `lyrics.service.ts` или тонкий `track-assemble.service` рядом; резолверы тонкие.

### 4. UI

Один раздел меню `generations` → живой `history`/`assemble`: сверху сборка, снизу история. Feature `catalog-assemble`. Заглушку disabled снять.

## Risks / Trade-offs

- [Мало фраз на роль] → пустые слоты и подпись; повтор «Собрать».
- [Удалённая фраза в истории] → null lyricId или missing include → «фраза удалена».
- [Два VERSE в каркасе] → явный дедуп по lyricId между слотами.

## Migration Plan

1. Prisma migrate `LyricCollage`.
2. GraphQL + service.
3. Клиентская панель и меню.
4. Откат: drop table / убрать query; каталог не зависит.

## Open Questions

Нет.
