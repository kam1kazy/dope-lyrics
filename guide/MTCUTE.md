### ⚙️ Подключаем telegram бота

1. Заполняем файл .env в папке server (пример в .env.example).
   Вам нужен обязательно API_ID и API_HASH. Получить API_ID и API_HASH можно на сайте https://my.telegram.org/apps

```bash
API_ID=
API_HASH=
BOT_TOKEN=
BOT_PHONE=
BOT_PASS= (это пин пароль от телеграмма)
BOT_CHAT_ID=
BOT_CHANNEL_ID=
```

2. Как создать бота в telegram:

- Открываем telegram
- Ищем @BotFather
- Нажимаем на него
- Нажимаем на команду `/start`
- Нажимаем на команду `/newbot`
- Вводим имя бота
- Вводим имя пользователя (должно быть уникальным)
- Получаем токен бота
- Вставляем токен в .env файл

3. Как получить CHAT_ID и CHANNEL_ID:

- Открываем telegram
- Добавляем бота в нужную группу
- Даем права администратора
- Отправляем команду `/start` в группу
- Получаем CHAT_ID в консоли
- Вставляем CHAT_ID в .env файл

4. Получаем историю канала:

- Отправляем команду `/chathistory` в группу
- Получаем историю чата в консоли

5. Заливаем данные в базу:

Теперь можно выполнить команду для загрузки в базу данных: (выполняется из папки server)

```bash
bun seed
```

6. Делаем приложение видимым в telegram:

Установите Localtunnel с помощью npm:

```bash
  npm install -g localtunnel
```

Запустите Localtunnel:

```bash
lt --port 3000
```

В терминале появится ссылка вида:

```bash
https://violet-cougars-listen.loca.lt
```

Её нужно прислать @botfather'у чтобы он сделал приложение видимым в telegram.

Можно пользоваться.

### ⚙️ Предыдущие этапы

[Гайд по SETUP](https://github.com/kam1kazy/dope-lyrics/blob/main/guide/SETUP.md)

[Гайд по PRISMA](https://github.com/kam1kazy/dope-lyrics/blob/main/guide/PRISMA.md)

[Гайд по Docker](https://github.com/kam1kazy/dope-lyrics/blob/main/guide/DOCKER.md)
