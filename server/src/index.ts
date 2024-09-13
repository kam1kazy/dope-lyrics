// Плагины для сервера
import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

// GraphQL
import { yoga } from '@elysiajs/graphql-yoga'
import { schema } from './graphql/schema'
import chatHistory from '../bot-data/data/chatHistory.json'
// Переменные для запуска сервера
const isProduction = process.env.VERCEL_ENV === 'production'
const port: number = isProduction ? 4000 : 4000

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .use(yoga(schema))
  .listen(port)

export type App = typeof app

console.log(
  `\n🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/${schema.path}`
)
