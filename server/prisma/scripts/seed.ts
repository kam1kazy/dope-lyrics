import { PrismaClient } from '@prisma/client'

// Типы
import { UserType } from '../../src/types/user'
import { HashtagType } from '../../src/types/hashtags'
import { LyricType } from '../../src/types/lyrics'

// Дата для примера
import { lyrics, user, hashtags } from '../data'

const db = new PrismaClient()

const seed = async (user: UserType, hashtags: HashtagType[], lyrics: LyricType[]) => {
  await db.user.create({
    data: {
      email: user.email,
      password: user.password,
      name: user.name,
    },
  })
  await db.hashtag.createMany({ data: hashtags })
  await db.lyric.createMany({ data: lyrics })
}

seed(user[0], hashtags, lyrics)
  .then(() => console.log('🚚 Данные были успешно загружены в БД'))
  .catch((error) => console.error('🚧 Данные не удалось загрузить в БД', error))
  .finally(() => {
    db.$disconnect()
    console.log('🔌 База данных успешно отключена')
  })
