# Ветки

Схема с **11 ноября 2026**: `develop` — рабочий ствол, `main` — прод.

| Ветка | Что это | Кто двигает |
| --- | --- | --- |
| `develop` | Ствол. Сюда вливаются все задачи. Автор проверяет её локально. | Агент по просьбе «слей» |
| `main` | Прод. Push в `main` = выкатка на стенд через CI (`.github/workflows/deploy.yml`). | Только по слову автора «в прод» |
| `feat/…`, `fix/…`, `refactor/…`, `docs/…` | Одна задача — одна ветка от актуального `develop`. | Агент |

Push в `develop` и в ветки задач ничего не выкатывает: CI слушает только `main`.

---

## Задача

1. Перед кодом: `git status -sb`, `git branch` (при необходимости `-a`).
   - Есть ветка этой задачи — перейти на неё.
   - Задача ложится в уже открытую (тот же change, тот же кусок) — продолжить там.
   - Подходящей нет, и задача понятна — создать от актуального `develop`: `feat/…`, `fix/…`, `refactor/…`, для правил и доков `docs/…`.
   - Слаг ещё не ясен — ветку не плодить, сказать, что её нет.
2. Каждый законченный шаг — свой коммит на ветке задачи. Агент коммитит сам. По истории видно, как фича собиралась, шаг можно откатить.
3. В `develop` и `main` руками не писать.

## Слить задачу в `develop`

Только по просьбе. Просьба включает push ветки задачи до merge и push `develop` после.

```bash
git status -sb
git push -u origin HEAD            # upstream — origin/<имя-ветки>
git checkout develop
git pull --ff-only origin develop
git merge --no-ff <ветка> -m "Merge branch '<ветка>' into develop"
git push origin develop
```

`git merge` без `--no-ff` запрещён: история теряет точку, где задачу влили. Squash и fast-forward для задачи не использовать.

## В прод: `develop` → `main`

Только когда автор сам сказал «в прод» после локальной проверки `develop`. Слияние задачи в `develop` этого не включает.

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff develop -m "Merge branch 'develop' into main"
git push origin main               # выкатка
```

Перед этим `bun run fix` зелёный в `client/` и `server/`. Деплой и бэкап — [status](./status.md), не выкатывать руками поверх рана CI.

---

## Было раньше

До 11.11.2026 стволом был `main`, а `origin/develop` — склад старой работы (auth на NextAuth/JWT, перекладка сервера). Склад заменён: `develop` догнала `main` и стала стволом. Auth и сессии по-прежнему из youways ([youways-baseline](./youways-baseline.md)), не из старых веток.
