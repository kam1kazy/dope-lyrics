## Context

См. proposal.md — Why. Сейчас `assembleTrack(preset: HIT | CANVAS)` и `TRACK_QUOTAS` в `server/src/modules/lyrics/track-assemble.ts`: диапазон строк, `pickSlotTarget` тычет случайно внутри. UI — два радио в `catalog-generator-pane.tsx`, состояние в `catalog-menu.tsx`. Telegram не участвует.

## Goals / Non-Goals

**Goals:**

- Квота слота = N абзацев × 4 строки, N с клиента.
- Пресеты только на клиенте, подставляют числа.
- `localStorage` для формы; GraphQL без пресета.

**Non-Goals:**

- Новый kit-инпут shadcn; поле в feature, как switch адлибов.
- Сохранять раскрытие «Показать ещё».
- Менять `hideAdlibs` и фильтр пула.

## Decisions

### 1. Input квот, пресет уходит с сервера

`assembleTrack(form: TrackFormQuotas!, hideAdlibs, filter)`.

```
input TrackFormQuotas {
  intro: Int!
  verse: Int!
  hook: Int!
  bridge: Int!
}
```

`assembleSlotsFromPools(catalog, quotas)`: `min = max = n * 4`; при `n === 0` слот пустой. `pickSlotTarget` без random по диапазону. Enum `TrackFormPreset` в GraphQL убрать вместе с аргументом `preset`.

Альтернатива — оставить `preset` и слать числа опционально: два источника правды, лишнее.

Отрицательные / не Int — `GraphQLError` по-русски. Потолка нет: пул конечный, `fillSlot` и так останавливается.

### 2. Числа пресетов на клиенте

| | хит (default) | полотно |
| --- | --- | --- |
| INTRO | 0 | 0 |
| VERSE | 6 | 8 |
| HOOK | 2 | 4 |
| BRIDGE | 0 | 0 |

Бывшие max куплета/хука; интро и бридж 0, пока автор не раскроет. Клик по пресету перезаписывает все четыре поля. Подсветка пресета — если четыре числа совпадают с таблицей; иначе ни один.

### 3. UI полей

В `catalog-generator-pane.tsx` под радио: два `input type="number" min={0} step={1}` (куплет, хук). Строка-кнопка «Показать ещё» / «Скрыть» — интро и бридж. Состояние раскрытия — `useState`, в storage не писать. Пустое поле на blur → 0.

Состояние формы живёт в `catalog-menu.tsx` и уходит в `assembleTrack`.

### 4. localStorage

Ключ `dope-lyrics.generator-form`. JSON `{ intro, verse, hook, bridge }` — целые ≥ 0. Битый JSON / нет ключа → хит. Писать при каждом валидном изменении. Не синкать между вкладками сверх `storage` по желанию: достаточно читать при монтировании меню.

`hideAdlibs` не трогать.

## Risks / Trade-offs

- [Огромное N] → набор остановится, когда пул кончится; слот просто короткий.
- [Интро/бридж по умолчанию 0] → HIT больше не подмешивает случайное интро; это цена скрытых полей.
- [Старый клиент шлёт preset] → ломается; локальный прототип, один клиент.

## Migration Plan

1. Сервер: квоты из input, тесты на 0 и точное N.
2. GraphQL: `form`, убрать `preset`.
3. Клиент: поля, storage, query.
4. Откат: вернуть `TRACK_QUOTAS` и аргумент `preset`; ключ storage можно оставить.

## Open Questions

Нет.
