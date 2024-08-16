FROM node:alpine

WORKDIR /src

COPY package.json ./
COPY package-lock.json ./
COPY ./ ./

RUN bun install

CMD ["bun", "run", "deploy"]