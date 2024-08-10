// Плагины для сервера
import { Elysia, t } from 'elysia'
import { yoga } from '@elysiajs/graphql-yoga'
import { cors } from '@elysiajs/cors'

// Локальные подключения
import { typeDefinitions } from './graphql/schema'
import { PrismaClient } from '@prisma/client'

import { resolvers } from './graphql/resolvers'
import { lyrics } from './graphql/data'

const db = new PrismaClient()

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

  .post(
    '/sign-up',
    async ({ body }) =>
      db.user.create({
        data: body,
      }),
    {
      body: t.Object({
        id: t.Number(),
        text: t.String(),
        is_reaction: t.Boolean(),
        paragraph_count: t.Number(),
        word_count: t.Number(),
        hashtag_count: t.Number(),
        hashtags: t.Array(t.String()),
      }),
    }
  )
  .listen(4000)

export { app }

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/graphql`)
