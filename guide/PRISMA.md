### ⚙️ Команды для работы с базой данных через Prisma ORMc

Все команды ниже выполняются из папки server

```bash
cd server
```
Для работы с базой данных нам потребуется программа Docker, если ее нет, то установите ее по [ссылке](https://www.docker.com/products/docker-desktop/).
После установки программы нужно авторизоваться. Данные будут храниться в контейнере, который будет создан командами ниже. Если программа выключена, то приложение не увидит данные и команды ниже не сработают.

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

5. Для базы потребуется добавить пользователя к которому будет привязаны данные (можете сделать это ручками):
 
Создаем папку bot-data/data и в ней создадим файл usersData.json
```bash
mkdir -p bot-data/data
New-Item -Path bot-data/data/usersData.json -ItemType File
```
Добавим туда объект с данными пользователей:

```json
{
  "users": [
    {
      "id": 0,
      "username": "test",
      "password": "test",
      "email": "test@test.com",
    }
  ]
}
```

6. Выполняет посев (заливает данные) - сейчас в этом нет необходимости, так как нет данных полученных из ботом (они будут в папке bot-data), но если потребуется, то выполняем команду, чтобы добавить пользователей в базу:
```bash
bun seed
```

### ⚙️ Следующий этап

[Гайд по MTCUTE](https://github.com/kam1kazy/dope-lyrics/blob/main/guide/MTCUTE.md)

### ⚙️ Предыдущий этап

[Гайд по SETUP](https://github.com/kam1kazy/dope-lyrics/blob/main/guide/SETUP.md)
