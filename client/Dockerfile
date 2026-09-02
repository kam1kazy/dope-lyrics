# Базовый образ
FROM oven/bun:1.4.0-alpine AS base
WORKDIR /src

# Этап установки зависимостей
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Этап разработки
FROM base AS dev
COPY --from=install /src/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["bun", "run", "dev"]

# Этап сборки продакшена
FROM base AS build
COPY --from=install /src/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Финальный образ для продакшена
FROM base AS release
COPY --from=build /src/.next ./.next
COPY --from=build /src/public ./public
COPY --from=build /src/package.json ./package.json
COPY --from=install /src/node_modules ./node_modules
EXPOSE 3000
CMD ["bun", "run", "start"]