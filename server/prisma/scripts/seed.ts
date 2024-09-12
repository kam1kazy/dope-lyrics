import { PrismaClient } from '@prisma/client'

// Типы
import {
  LyricType,
  HashtagsType,
  UserType,
  ChatType,
  MediaType,
  ReactionType,
  MessageType,
  ReplyToMessageType,
  EmojiType,
} from '../../src/types/index'

// Дата
import chatHistory from '../../bot-data/data/chatHistory.json'

const db = new PrismaClient()

const seed = async (
  user: UserType[],
  hashtags: HashtagsType[],
  lyrics: LyricType[]
) => {
  console.log(`🧻 Наполнение БД фиктивными данными...`)

  for (const user of users) {
    const createUser = await db.user.create({
      data: user,
    })

    console.log(`🟢 Пользователь с id: ${createUser.id} - успешно создан`)
  }

  for (const lyric of lyrics) {
    const createLyric = await db.lyric.create({
      data: lyric,
    })

    console.log(`🟢 Лирика с id: ${createLyric.id} - успешно создана`)
  }

  for (const hashtag of hashtags) {
    const createHashtag = await db.hashtag.create({
      data: hashtag,
    })

    console.log(`🟢 Хэштег с id: ${createHashtag.id} - успешно создан`)
  }

  // await db.user.create({
  //   data: {
  //     email: user.email,
  //     password: user.password,
  //     name: user.name,
  //   },
  // })
  // await db.hashtag.createMany({ data: hashtags })
  // await db.lyric.createMany({ data: lyrics })
}

seed(users, hashtags, lyrics)
  .then(() => console.log('🚚 Данные были успешно загружены'))
  .catch((error) => {
    console.error('🚧 Данные не удалось загрузить данные', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
    console.log('🔌 База данных успешно отключена')
  })
