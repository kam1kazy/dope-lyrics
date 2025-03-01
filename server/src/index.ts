// Плагины для сервера
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

// GraphQL
import { yoga } from '@elysiajs/graphql-yoga'
import { schema } from './graphql/schema'

// JWT
import { jwt } from '@elysiajs/jwt'

//env
import dotenv from 'dotenv'
import { authRoutes } from './routes/authRoutes'


dotenv.config()

// Переменные для запуска сервера
const port: number = Number(process.env.PORT) || 4000

const app = new Elysia()
  // State management for JWT and cookies
  // .state('jwt', null as null | ReturnType<typeof jwt>)
  // .state('setCookie', null as null | {
  //   set: {
  //     cookie: (options: { name: string; value: string; options?: Record<string, any> }) => void
  //   }
  // })
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
  // Маршруты аутентификации
  .use(authRoutes)
  .use(yoga(schema))
  .listen(port);



export type App = typeof app

console.log(
  `\n🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/${schema.path}`,
)
