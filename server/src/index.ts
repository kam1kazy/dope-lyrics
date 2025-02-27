// Плагины для сервера
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

// GraphQL
import { yoga } from '@elysiajs/graphql-yoga'
import { schema } from './graphql/schema'

//env
import dotenv from 'dotenv'
import seed from '../prisma/script/seed'
dotenv.config()

// Переменные для запуска сервера
const port: number = Number(process.env.PORT) || 4000

const app: Elysia = new Elysia()
.use(cors({
  origin: 'http://localhost:3000', // Разрешите запросы только с этого источника
  credentials: true, // Разрешите отправку куки
}))
.use(swagger())
.use(yoga(schema))
.listen(port)

export type App = typeof app

console.log(
  `\n🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/${schema.path}`,
)

// seed()