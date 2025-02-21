# Базовый образ
FROM oven/bun:1.2.2-alpine AS base
WORKDIR /src

# Этап установки зависимостей
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Этап сборки
FROM base AS build
# Установка postgresql-client для Alpine
RUN apk update && apk add --no-cache postgresql-client
# Копирование и настройка wait-for-db.sh
COPY wait-for-db.sh .
RUN chmod +x wait-for-db.sh
# Копирование зависимостей и кода
COPY --from=install /src/node_modules ./node_modules
COPY . .
# Генерация Prisma
RUN bun run generate

# Финальный образ для разработки
FROM base AS dev
COPY --from=build /src .
EXPOSE 4000
CMD ["sh", "-c", "./wait-for-db.sh db 'bunx prisma migrate deploy && bun run seed && bun run start'"]

# Финальный образ для продакшена
FROM base AS release
COPY --from=build /src .
EXPOSE 4000
CMD ["bun", "run", "start"]