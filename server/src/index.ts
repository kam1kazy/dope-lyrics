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

const isProduction = process.env.VERCEL_ENV === 'production'
const port = isProduction ? undefined : 4000

const app = new Elysia()
  .use(cors())
  .use(
    yoga({
      typeDefs: typeDefinitions,
      context: createContext,
      resolvers,
    })
  )
  .use(swagger())
  .get('/', () => 'Dope server -> OK', {
    detail: {
      tags: ['Dope server'],
    },
  })
  .listen(port)

export { app }

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/graphql`)
