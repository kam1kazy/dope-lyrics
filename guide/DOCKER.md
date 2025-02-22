## 🛠️ Команды Docker


Маст хэв

```bash
# Посмотреть конфигурацию
docker-compose config

# Запуск в фоне
docker-compose up -d

# Просмотр логов
docker-compose logs -f                  # все контейнеры
docker-compose logs -f nginx           # конкретный контейнер

# Статус контейнеров
docker-compose ps

# Остановка
docker-compose down

# Остановить контейнеры, но сохранить volumes
docker-compose down -v

# Удалить все контейнеры и образы
docker-compose down -v --rmi all

# Удалить все образы
docker system prune -a --volumes

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

9. **Остановить контейнеры и удалить volumes**

```bash
docker-compose down -v
```

10. **Посмотреть конфигурацию**

```bash
docker-compose config
```


