// Плагины для сервера
import { Elysia, t } from 'elysia'
import { yoga } from '@elysiajs/graphql-yoga'
import { cors } from '@elysiajs/cors'

// Локальные подключения
import { typeDefinitions } from './graphql/schema'
import { PrismaClient } from '@prisma/client'

import { resolvers } from './graphql/resolvers'
import { lyrics } from './graphql/data'

import { Lyric } from './types/lyrics'

const db = new PrismaClient()

// Использование свойства lyric у объекта db для выполнения операций с моделью Lyric
const createLyric = async (data: Lyric) => {
  const lyric = await db.lyric.create({ data })
  return lyric
}

const findAllLyrics = async () => {
  const lyrics = await db.lyric.findMany()
  return lyrics
}

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
    '/create-lyric',
    async ({ body }) => {
      const lyric = await db.lyric.create({
        data: {
          text: body.text,
          is_reaction: body.is_reaction,
          paragraph_count: body.paragraph_count,
          word_count: body.word_count,
          hashtag_count: body.hashtag_count,
          hashtags: body.hashtags,
        },
      })
      return lyric
    },
    {
      body: t.Object({
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
