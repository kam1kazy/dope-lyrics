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
ARG NEXT_PUBLIC_BASE_PATH=
ARG BASE_URL=http://localhost:4000
ENV NODE_ENV=production
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV BASE_URL=$BASE_URL
RUN bun run build

# Финальный образ для продакшена
FROM base AS release
COPY --from=build /src/.next ./.next
COPY --from=build /src/public ./public
COPY --from=build /src/package.json ./package.json
COPY --from=build /src/next.config.mjs ./next.config.mjs
COPY --from=install /src/node_modules ./node_modules
ARG NEXT_PUBLIC_BASE_PATH=
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]