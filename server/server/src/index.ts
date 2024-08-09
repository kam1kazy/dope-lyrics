import { Elysia } from 'elysia'
import { yoga } from '@elysiajs/graphql-yoga'
import { typeDefinitions } from './graphql/schema'
import { resolvers } from './graphql/resolvers'

const app = new Elysia()
  .use(
    yoga({
      typeDefs: typeDefinitions,
      context: {
        name: 'Mobius',
      },
      resolvers,
    })
  )
  .listen(4000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
