// Плагины для сервера
import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

// GraphQL
import { yoga } from '@elysiajs/graphql-yoga'
import { schema } from './graphql/schema'

// Переменные для запуска сервера
const port: number = 4000

const app: Elysia = new Elysia()
  .use(cors())
  .use(swagger())
  .use(yoga(schema))
  .listen(port)

export type App = typeof app

console.log(
  `\n🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/${schema.path}`
)
