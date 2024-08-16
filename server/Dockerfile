FROM oven/bun:1 as build

WORKDIR /src

COPY package.json ./
COPY ./ ./

RUN bun install

CMD ["bun", "run", "deploy"]