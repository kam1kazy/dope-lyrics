import { PrismaClient } from '@prisma/client'
import { LyricType } from '../types/lyrics'
import { lyrics } from '../graphql/data'

const db = new PrismaClient()

// Использование свойства lyric у объекта db для выполнения операций с моделью Lyric
// const createLyric = async (data: Lyric) => {
//   const lyric = await db.lyric.create({ data })
//   return lyric
// }

// const findAllLyrics = async () => {
//   const lyrics = await db.lyric.findMany()
//   return lyricsz
// }

const seed = async (lyrics: LyricType[]) => {
  for (let i = 0; i < lyrics.length; i++) {
    await db.lyric.create({ data: lyrics[i] })
  }
}

seed(lyrics)
  .then(() => console.log('Data seeded successfully'))
  .catch((error) => console.log("Data couldn't be seeded", error))
  .finally(() => {
    db.$disconnect()
    console.log('Data disconnected successfully')
  })
