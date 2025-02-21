## 🛠️ Команды Docker


Маст хэв

```bash
# Посмотреть конфигурацию
docker-compose config

# Остановить контейнеры, но сохранить volumes
docker-compose down

# Пересобрать и запустить
docker-compose up --build

```


1. **Посмотреть все контейнеры**

```bash
docker compose ps
```

2. **Посмотреть все образы**

```bash
docker images
```

3. **Удалить неиспользуемые образы**

```bash
docker image prune -a
```

4. **Удалить неиспользуемые контейнеры**

```bash
docker container prune
```

5. **Посмотреть все сети**

```bash
docker network ls
```

5. **Остановить все контейнеры**

```bash
docker-compose down
```

6. **Запустить с пересборкой**

```bash
docker-compose up --build
```

7. **Посмотреть логи**

```bash
docker logs -f <container_name>
```

8. **Посмотреть информацию о контейнере**

```bash
docker inspect <container_name>
```
