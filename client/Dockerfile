FROM oven/bun:1 as build

WORKDIR /app

COPY package.json ./
COPY ./ ./

RUN bun install

COPY ./ ./

RUN bun run build

FROM nginx:stable-alpine

EXPOSE 3000

CMD [ "nginx", "-g", "daemon off;" ]