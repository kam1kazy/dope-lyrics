FROM oven/bun:1 as build

WORKDIR /app

COPY package.json ./
COPY ./ ./

RUN bun install

COPY ./ ./

RUN bun run build

FROM nginx:stable-alpine

COPY --from=build app/dist/comp-lib  /usr/share/nginx/html
COPY --from=build nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD [ "nginx", "-g", "daemon off;" ]