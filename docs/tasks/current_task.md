# Current task

Фаза: **A. Локальный контур** — [`../roadmap.md`](../roadmap.md)

---

**Current:** поднять комп без бота и без домена. Ветки — от `main`, не от develop ([`../git.md`](../git.md)).

- моковый `.env` уже можно класть локально (gitignored)
- Postgres: не занимать 5432 (там youways)
- `bun run setup` → миграция → GraphQL + Next
- починить Apollo → `/graphql`

План: [`001_local_contour.md`](001_local_contour.md)

---

**Дальше:** B — живые заметки из Telegram.

**Потом / параллельно после A:** [002](002_youways_baseline.md) — lint/`fix` уже стоят; остались TS 7, свежие runtime-зависимости и образы.
Auth и защита хоста — из youways, не с develop. [`../youways-baseline.md`](../youways-baseline.md)

**Экран:** сначала взглянуть на живой Chakra-прототип. Снос всего Chakra и shadcn — дорожка C, не сейчас. D — фильтры и эталоны.

OpenSpec change на A ещё нет. Когда начнём реализацию контура — `/opsx-propose local-dev-contour`.
