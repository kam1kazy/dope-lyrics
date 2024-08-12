import { PrismaClient } from '@prisma/client'
import { LyricType } from '../../server/src/types/lyrics'
import { lyrics } from '../data'

const db = new PrismaClient()

const seed = async (lyrics: LyricType[]) => {
  const user = await db.user.create({
    data: {
      email: 'example@example.com',
      password: 'password',
      name: 'Example User',
    },
  })

  // await db.lyric.createMany({ data: lyrics })
}

seed(lyrics)
  .then(() => console.log('Data seeded successfully'))
  .catch((error) => console.log("Data couldn't be seeded", error))
  .finally(() => {
    db.$disconnect()
    console.log('Data disconnected successfully')
  })
