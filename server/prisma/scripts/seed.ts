import { PrismaClient } from '@prisma/client'

// Типы
import { UserType } from '../../src/types/user'
import { HashtagType } from '../../src/types/hashtags'
import { LyricType } from '../../src/types/lyrics'

// Дата для примера
import { lyrics, user, hashtags } from '../data'

const db = new PrismaClient()

const seed = async (user: UserType, hashtags: HashtagType[], lyrics: LyricType[]) => {
  await db.user.create({ data: user })
  await db.hashtag.createMany({ data: hashtags })
  await db.lyric.createMany({ data: lyrics })
}

seed(user[0], hashtags, lyrics)
  .then(() => console.log('Data seeded successfully'))
  .catch((error) => console.log("Data couldn't be seeded", error))
  .finally(() => {
    db.$disconnect()
    console.log('Data disconnected successfully')
  })
