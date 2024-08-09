// Плагины для сервера
import { Elysia } from 'elysia'
import { yoga } from '@elysiajs/graphql-yoga'
import { cors } from '@elysiajs/cors'

// Локальные подключения
import { typeDefinitions } from './graphql/schema'
import { resolvers } from './graphql/resolvers'
import { lyrics } from './graphql/data'

const app = new Elysia()
  .use(cors())
  .use(
    yoga({
      typeDefs: typeDefinitions,
      context: () => {
        return { lyrics }
      },
      resolvers,
    })
  )
  .get('/', () => {
    lyrics
  })
  .post('/', ({ body }) => body)
  .listen(4000)

export { app }

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/graphql`)
