### ⚙️ Команды для работы с базой данных через Prisma ORMc

Все команды ниже выполняются из папки server

```bash
cd server
```

1. Открыть базу данных:

```bash
bunx prisma studio
```
2. Генерируем Prisma Client (не нужно, если выполняли команду setup из корня):

```bash
bun prisma generate
```

3. Удаляет и заново создает БД ("мягкий сброс"), удаляя все данные, таблицы, индексы и другие артефакты:

```bash
bunx prisma migrate reset --skip-seed
```

4. Создает миграции:
```bash
bunx prisma migrate dev --name init --skip-seed
```

5. Выполняет посев (заливает данные) - сейчас он не срабатывает, так как нет данных полученных из ботом (они будут в папке bot-data):
```bash
bun seed
```

### ⚙️ Следующий этап

[Гайд по MTCUTE](https://github.com/kam1kazy/dope-lyrics/blob/main/guide/MTCUTE.md)

### ⚙️ Предыдущий этап

[Гайд по SETUP](https://github.com/kam1kazy/dope-lyrics/blob/main/guide/SETUP.md)
