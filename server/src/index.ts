// Плагины для сервера
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

// GraphQL
import { yoga } from '@elysiajs/graphql-yoga'
import { schema } from './graphql/schema'
import { prisma } from '~/lib/prisma'

// JWT
import { jwt } from '@elysiajs/jwt'
import { cookie } from "@elysiajs/cookie";

//env
import dotenv from 'dotenv'
import { authRoutes } from './routes/authRoutes'
dotenv.config()

// Переменные для запуска сервера
const port: number = Number(process.env.PORT) || 4000

const app = new Elysia()
  .use(cors({
    origin: 'http://localhost:3000', // Разрешите запросы только с этого источника
    credentials: true, // Разрешите отправку куки
  }))
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "supersecretkey", // Установите в .env
      exp: "7d", // Время жизни токена
    })
  )
  .use(cookie())
  .use(swagger())
  .use(yoga(schema))
  .listen(port)


export type App = typeof app

authRoutes(app)

console.log(
  `\n🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/${schema.path}`,
)
