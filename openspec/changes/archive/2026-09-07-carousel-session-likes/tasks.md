## 1. Заход 1 — сессия и жест

- [x] 1.1 Расширить `CarouselSessionProvider`: likedIds, toggleLike / removeLike / clearLikes; опционально снимок текста при лайке.
- [x] 1.2 `Viewport`: свайп влево → toggle like по catalog id; вертикаль — скраб; flash сердца; метка на слайдах уже лайкнутого сообщения.
- [x] 1.3 Chrome «Стоп» с бейджем; оверлей списка лайкнутых (пустое состояние по-русски); снять лайк; открыть карточку.

## 2. Заход 2 — история и isUsed

- [x] 2.1 Prisma `isUsed` + миграция; GraphQL поле и `updateLyricFlags`; seed не трогает.
- [x] 2.2 «Сохранить в историю» → `saveCarouselHistory(..., SHUFFLE)`; после успеха clearLikes.
- [x] 2.3 «Использовал» (одно / весь список) → `isUsed`; подсветка на слайде без скрытия с карусели.

## 3. Заход 3 — карточка и меню

- [x] 3.1 Кнопка «Использовал» на карточке сообщения.
- [x] 3.2 Подсветка `isUsed` в списках меню каталога.
- [x] 3.4 После archive: `docs/status.md`, `current_task.md`, MINOR в `docs/versions.md`.
