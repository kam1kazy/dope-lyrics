## Context

Карусель — `LyricList` → `Viewport`: порядок задаёт сервер (`shuffleSeed` / дата), клиент режет строки в слайды. Своей очереди нет. Карточка — `MessageDeskDialog` (с карусели и из меню). Ряд очереди только из меню: с карусели эти кнопки почти бесполезны. Решафл — `ControlBar.setSortMode('shuffle')`. История генератора — `LyricCollage`, не трогаем. См. proposal.md.

## Goals / Non-Goals

**Goals:**

- Сессия `catalog | queue` на клиенте, без Prisma в заходе 1.
- Снимки в Postgres в заходе 2; один UI списка, две двери.
- Жесты списка — заход 3, на уже живом списке.

**Non-Goals:**

- Общий HistoryEntity на коллажи и карусель.
- Писать генератор/ИИ в снимки в этом change (enum в схеме — да).
- Telegram.

## Decisions

### 1. Сессия на клиенте

`CarouselSessionProvider` рядом с `LyricViewProvider` / `PlaybackProvider`: `mode`, `queue: ILyric[]`, `prepend: ILyric | null`. `LyricList` в `queue` строит слайды из очереди (пагинация каталога не нужна); в `catalog` — текущий запрос плюс опциональный prepend. Решафл сбрасывает mode в catalog и чистит queue/prepend. Кнопки очереди на карточке — проп `showQueueActions` из `CatalogLyricsList`; с `Viewport` не передаётся. Ряд только на табе «Текст», у кнопок тултипы. В `CatalogLyricsList` при `mode === queue` и непустой очереди — переключатель «В карусели» и иконка `Play` справа у фраз из очереди; фильтр рендерит уникальные id очереди по `date` убыв.

Альтернатива: тащить очередь в `LyricViewContext` — смешает фильтры и плейлист.

### 2. История — отдельная таблица

`CarouselHistory`: `lyricIds Int[]`, `previewText`, `source` (`SHUFFLE` | `QUEUE` | `GENERATOR` | `AI`), `isLiked`, `createdAt`. Не FK на Lyrics. Лимит 12 в сервисе при insert.

Снимок каталога: query `lyricIds` с теми же фильтрами и seed, что `lyrics`. Воспроизведение: `lyricsByIds` с сохранением порядка → mode queue.

Альтернатива хранить только seed+фильтры — дешевле, но после правок каталога порядок плывёт.

### 3. Меню, не второй экран

Пункт «История» в `catalog-menu`. Кнопка под решафлом зовёт `openSection('history')` через тонкий `CatalogMenuProvider`. Лайк: как `likeCollage` / `unlikeCollage` (повтор сердца удаляет). `formatCollageDate` вынести в shared, без общего типа истории.

### 4. Три захода в одном change

Один контракт, `tasks.md` тремя блоками. Apply останавливается после захода 1 и 2.

## Risks / Trade-offs

- [Полный шаффл в `lyricIds`] → тысячи id в JSON, для 12 записей приемлемо.
- [Жесты vs свайп меню] → `data-swipe-ignore` на списке; стрелка — основной запуск на таче.
- [Unlike удаляет, корзина тоже] → одно и то же удаление, как у генератора.

## Migration Plan

1. Заход 1: только клиент, откат — убрать провайдер и кнопки.
2. Заход 2: migrate `CarouselHistory`; откат — drop table, убрать query.
3. Заход 3: только UI жестов.

## Open Questions

Нет.
