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

`cd ****` -> перемещается по каталогу через консоль (терминал / shell / cli), где \*\*\*\* - это имя дериктории.

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

4. **setup db postgress with docker**

```bash
docker run -p 5432:5432 --name NAME-DOCKER-CONTAINER -e POSTGRES_PASSWORD=UPASSDB -e POSTGRES_DB=UNAMEDB -e POSTGRES_USER=UUSERDB -d postgres
```

### ⚙️ Следующий этап

[Гайд по PRISMA](https://github.com/kam1kazy/dope-lyrics/blob/main/guide/PRISMA.md)

[Гайд по MTCUTE](https://github.com/kam1kazy/dope-lyrics/blob/main/guide/MTCUTE.md)

[Гайд по Docker](https://github.com/kam1kazy/dope-lyrics/blob/main/guide/DOCKER.md)
