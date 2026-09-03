## Context

См. proposal.md — Why. Генератор уже собирает слоты с `lyricId` / `startLine` / `endLine` (`assembleTrack`, `likeCollage`). Разрез умеет перекладывать коллажи (`remapCollageSlotsAfterSplit` в `track-assemble.ts`). Полки — `isHidden` / `isFavorite` / `isReference` / `isCensored`; фильтр — `includeShelves` / `excludeShelves`. Telegram в этом change не участвует: только GraphQL и Postgres.

## Goals / Non-Goals

**Goals:**

- Одна мутация `glueLyrics(slots, hideOriginals)` создаёт запись и опционально дербанит доноров.
- `isDonor` — полка приложения, как эталон.
- UI: кнопка + модалка в `catalog-assemble-panel.tsx`; полка в карточке, чипах, сводке.

**Non-Goals:**

- Удаление записей; ИИ; второй ползунок разреза; нарезка списком.

## Decisions

1. **Текст склейки** — `splitGeneratorLines` + slice по диапазону, без `hideAdlibs`. Между слотами `\n\n`. Второй HOOK каркаса пропускаем (индекс 5), чтобы не дублировать хук.
2. **Вырезание inplace** — индексы по очищенным строкам; маппинг на сырые `\n`-строки; остаток join. Если после выреза нет непустых очищенных строк — оставляем исходный текст, только `isHidden` (как «забрали всё»).
3. **`isDonor`** только когда реально вырезали часть (остался непустой остаток и текст изменился). Забрали всё → скрыть без `isDonor`.
4. **Новая запись** — `lyric_id = 0`, `message_id = 0`, `date = now`, без реакций/медиа/хештегов; владелец — `usersService.getOwner()`.
5. **Перекладка коллажей** — после вырезания по донору: куски, пересекающиеся с взятыми диапазонами, переносятся на id новой записи; остальные индексы на доноре сдвигаются (удалённые очищенные строки). Аналог `remapCollageSlotsAfterSplit`.
6. **Полка `donors`** — рядом с `hidden` в `SHELF_FLAGS` на клиенте и сервере; в сводке — `donors: CatalogShelfStat`.

## Risks / Trade-offs

- [Риск] Несовпадение «очищенных» и сырых строк при вырезании → Mitigation: явный маппинг индексов; тесты на хештеги/пустые строки.
- [Риск] Несколько частей из одной фразы в разных слотах → Mitigation: собрать все диапазоны по `lyricId`, вырезать одним проходом (union интервалов).
- [Риск] История без перекладки показывает обрубки → Mitigation: обязательный remap в той же транзакции.

## Migration Plan

Prisma migrate: колонка `isDonor BOOLEAN NOT NULL DEFAULT false`. Откат — drop column. Существующие строки — `false`.
