// Плагины для сервера
import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

// GraphQL
import { yoga } from '@elysiajs/graphql-yoga'
import { resolvers } from './graphql/resolvers'
import { typeDefinitions } from './graphql/querys'

// Контекст Prisma
import { createContext } from './context'

// Bot Telegram
import { bot } from './gramio'

// Переменные для запуска сервера
const isProduction = process.env.VERCEL_ENV === 'production'
const port: number = isProduction ? 4000 : 4000
const pathApi: string = 'graphql'

const app = new Elysia()
  .use(cors())
  .use(
    yoga({
      typeDefs: typeDefinitions,
      context: createContext,
      resolvers,
      path: pathApi,
    })
  )
  .use(swagger())
  .get('/', () => 'Dope server -> OK', {
    detail: {
      tags: ['Dope server'],
    },
  })
  .get(
    '/sign',
    ({ body }) => {
      return body
    },
    {
      body: t.Object({
        name: t.String(),
        password: t.String(),
      }),
    }
  )
  .listen(port)

export type App = typeof app

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/${pathApi}`
)
