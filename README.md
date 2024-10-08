# Dope Lyrics

Телеграм бот для систематизации заметок из группы и выдачи по критериям в виде текста, который можно зачитывать на манер караоке в красивом интерфейсе и с гибкими настройками.

## 🚀 Demo

Цикл разработки:
- ~~собрать интерфейс~~
- ~~собрать сервер~~
- ~~создать базу~~
- ~~подключить Telegram~~
- ~~парсинг чата в базу данных~~
- раскидать функции по командам для бота
- ~~настроить вывод на клиенте~~
- доделать интерфейс
- деплой
- придумать, как шифровать сообщения, чтобы я не смог их прочитать или расшифровать будучи владелец БД
  (либо сделать пакет, который легко и с 0 рублей, можно будет развернуть, да еще и с базой, да еще без понимания в IT)
- Авторизация с через соц.сети + ?свой ключ md5 к шифрованию базы 
- разработать разные фичи

TODO: 
- Типизировать: - Получаемый объект сообщения из Telegram (уже начал, но пока не подходит)
- хранить tg сеансы в бд?
- кэширование в GrapQL Yoga (server) и Apollo Client (client)

ФИЧИ:
- В компоненте Error сделать кнопку "обновить" - запрашивает данные еще раз
- Фильтры:
  - Сортировка Давние/Новые/Случайно
  - Диапозон дат
  - Кол-во слов/абзац
  - Хэштеги
  - По ключевым словам (ChakraUI - Highlight)
- Сохранять настройки пользователя
- История сессий
- Вкл/Выкл - разделители между сообщениями с выбором стилей
- Вкл/Выкл - оторбражение хэштегов и в чате эмодзи или реакциях / режим минимализма (у сообщения будут шарики что имеются тэги или реацкии ChakraUI - Popover)
- 
- Возможность создать проекты, в которых, можно развивать текст до законченного состояния
- Автоисправление грамматический ошибок `TextGears` (: - оставить как опцию
  p.s. доп. опция: не исправлять слова, в которых буквы разного регистра (кроме первой)
- Во время паузы, печатается одно слово из базы машинным font'ом 
- Замылить текст тремя тапами 

%% Сложные
- перевод голосовых сообщений в текст (speech-to-text)
  `Google Voice Api`,
  `ACRCloud Speech To Text`,
  `Developer Musixmatch`
- GPT - для дописание на лету или для попыток склеить несколько сообщений
- Tune Tracker - указать ключ и смотреть попадание в ноты
- Загрузка бита и запись черновых демок
- Совместная сессия по онлайн - Создается комната, приглашаются участники. У каждого своя папка с текстами. Каждый может перейти к другому и выборать любой из текстов, чтобы: предложить правку, создать копию у себя. 


# 🌟 stack

`bun.sh`
`elysia.js`
`@elysia/graphql-yoga`
`prisma`
`next.js`
`mtcute`

## 🛠️ Установка

Для установки проекта выполните следующую команду:

1. **Clone the repository**

Команда ниже скачает репозиторий и создаст папку dope-lyrics

```bash
git clone https://github.com/kam1kazy/dope-lyrics.git
```

Если у вас при клонировании прерывается с ошибкой "fatal: fetch-pack: invalid index-pack output".
Это может быть связана с размером буфера Git, который используется для передачи данных.
Репозиторий очень большой, вы можете попробовать клонировать его с опцией --depth, которая позволяет клонировать только последние коммиты:
Вы можете увеличить размер буфера, используя команду `git config` и скачать только последний коммит с флагом `--depth 1`:

```bash
git config --global http.postBuffer 524288000
```

После загрузки, нужно перейти в папке с проектом.
Если вы вводили в терминале IDE, то в потребуется перейти в папку самого проекта, для этого можно воспользоваться File -> Open Folders, либо командой `cd dope-lyrics`

```bash
cd dope-lyrics
```
Вводите команды по очереди во избежание ошибок.

`cd ****` -> перемещается по каталогу через консоль (терминал / shell / cli), где **** - это имя дериктории.

`cd ..` -> перемещается вверх по каталогу через консоль.

P.S. Можно вводить сразу несколько команд, они будут выполняться одна за другой, но может случится баг, что репозиторий не скачается, если попытаться сразу выполнить команду `cd dope-lyrics`

2. **Install dependencies**

Выполняем команду `bun run setup`, чтобы установить все зависимости (пакеты / плагины) в корневой папке, а так же в папках server и client.

```bash
bun run setup
```

3. **Start dev mode**

```bash
bun run dev
```

### ⚙️ Еще команды

Все команды ниже выполняются из папки server

```bash
cd server
```

1. Открыть базу данных:

```bash
bunx prisma studio
```

2. Удаляет и заново создает БД или выполняет "мягкий сброс", удаляя все данные, таблицы, индексы и другие артефакты:

```bash
bunx prisma migrate reset --skip-seed
```

3. Создает миграции:
```bash
bunx prisma migrate dev --name init --skip-seed
```

4. Выполняет посев (заливает данные):
```bash
bun seed
```


## 💻  Использование

После установки вы сможете взаимодействовать с вашим `Telegram` ботом и использовать его функции для систематизации записей.

## 🧐 Features

- **~~Подключение к группе Телеграм~~**

- **Создание новых фич**

- **Подключение GPT**

## 🙏 Support

Если вы хотите внести свой вклад, не стесняйтесь создавать проблемы или отправлять запросы на извлечение. Все предложения будут рассмотрены!

## 🍰 Лицензия

Этот проект лицензирован под MIT License.
