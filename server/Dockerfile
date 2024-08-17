FROM oven/bun:1 as build

WORKDIR /src

COPY package.json ./
COPY ./ ./

RUN bun install
RUN bun run generate
RUN bun run migrate
RUN bun run seed

CMD ["bun", "run", "start"]