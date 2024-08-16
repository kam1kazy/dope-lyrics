# Dope Lyrics

Телеграм бот для систематизации заметок из группы и выдачи по критериям в виде текста, который можно зачитывать на манер караоке в красивом интерфейсе и с гибкими настройками.

## 🚀 Demo

<a href="https://dope-lyrics.vercel.app/" target="blank">
    <img src="https://img.shields.io/website?url=https%3A%2F%2Frahuldkjain.github.io%2Fgh-profile-readme-generator&logo=github&style=flat-square" />
</a>

Try the tool: [Кликай чтобы затестить](https://dope-lyrics.vercel.app/)

# 🌟 stack

`bun.sh` 
`elysia.jx` 
`@elysia/graphql-yoga` 
`prisma` 
`next.js`

## 🛠️ Установка

Для установки проекта выполните следующую команду:

1. **Clone the repository**

Команда ниже скачает репозиторий и создаст папку dope-lyrics
Если вы вводили в терминале IDE, то в потребуется перейти в папке самого проекта, для этого можно воспользоваться File -> Open Folders, либо командой `cd dope-lyrics`

```bash
git clone https://github.com/kam1kazy/dope-lyrics.git
cd dope-lyrics
```

`cd ****` -> перемещается по каталогу через консоль (терминал / shell / cli), где **** - это имя дериктории.

`cd ..` -> перемещается вверх по каталогу через консоль.

Можно вводить сразу несколько команд, они будут выполняться одна за другой.

2. **Install dependencies**

Выполняем команду `bun run setup`, чтобы установить все зависимости (пакеты / плагины) в корневой папке, а так же в папках server и client.

```bash
bun run setup
bun install
```

3. **Start dev mode**

```bash
bun run dev
```

### ⚙️ Еще команды

1. Открыть базу данных:

```bash
bunx prisma studio  
```

2. Удаляет и заново создает БД или выполняет "мягкий сброс", удаляя все данные, таблицы, индексы и другие артефакты

```bash
npx prisma migrate reset
```

3. Выполняет миграцию для разработки
```bash
bunx prisma migrate dev --name init
```

## 💻  Использование

После установки вы сможете взаимодействовать с вашим `Telegram` ботом и использовать его функции для систематизации записей.

## 🧐 Features

- **Подключение к группе Телеграм**

- **Создание новых фич**

- **Подключение GPT**

## 🙏 Support

Если вы хотите внести свой вклад, не стесняйтесь создавать проблемы или отправлять запросы на извлечение. Все предложения будут рассмотрены!

## 🍰 Лицензия

Этот проект лицензирован под MIT License.
