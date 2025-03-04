// Плагины для сервера
import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

// GraphQL
import { yoga } from '@elysiajs/graphql-yoga'
import { schema } from './lib/graphql'

// JWT
import { jwt } from '@elysiajs/jwt'
import { cookie } from '@elysiajs/cookie'


// env
import dotenv from 'dotenv'
dotenv.config()

// Переменные для запуска сервера
const port: number = Number(process.env.PORT) || 4000

const app = new Elysia()
  // Настраиваем плагин JWT
  .use(jwt({
    name: 'jwt', // имя, которое будет использоваться для доступа к методам JWT
    secret: process.env.JWT_SECRET as string // секретный ключ для подписи токенов
  }))
  // Настраиваем плагин Cookie
  .use(cookie({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 86400, // 7 дней по умолчанию
  }))
  .use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }))
  .use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title: 'API Documentation',
        version: '1.0.0',
      },
    },
  }))
  .use(yoga(schema))
  .listen(port);



export type App = typeof app

console.log(
  `\n🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/${schema.path}`,
)
