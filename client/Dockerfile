FROM node:alpine as build

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY ./ ./

RUN bun install

COPY ./ ./

RUN bun run build

FROM nginx:stable-alpine

COPY --from=build /out /usr/share/nginx/html
COPY --from=build nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD [ "nginx", "-g", "daemon off;" ]