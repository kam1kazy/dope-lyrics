import { PrismaClient } from '@prisma/client'

// Типы
import { UserType, ConvertDataType } from '../../src/types/index'

// Дата
const chatUser = require('../../bot-data/data/usersData.json')
const convertHistory = require('../../bot-data/data/convertHistory.json')

const db = new PrismaClient()

const arrUser: UserType[] = chatUser
const arrConvert: ConvertDataType[] = [
  {
    userId: 0,
    message: {
      create: {
        text: 'Тебе кажется, что я легкий, как  J-SON \nНо положил твой прод, как Jason',
        message_id: 1948,
        word_count: 13,
        paragraph_count: 2,
        reactions: {
          create: {
            uniqueCount: 1,
            totalFreeCount: 1,
            totalPaidCount: 0,
            totalCount: 1,
            Emoji: {
              create: [
                {
                  emoji: '🔥',
                  isPaid: false,
                  count: 1,
                  order: 0,
                },
              ],
            },
          },
        },
        hashtags: null,
      },
    },
    user: {
      create: {
        id: -1001819066685,
        username: null,
        displayName: 'Фразочки',
        isAdmin: true,
      },
    },
    chat: {
      create: {
        id: -1001819066685,
        title: 'Фразочки',
        type: 'chat',
      },
    },
    date: '2024-09-13T11:18:11.000Z',
    editDate: '2024-09-13T12:47:46.000Z',
    isPinned: false,
    isChannelPost: true,
    replyToMessage: null,
    media: null,
  },
]

async function seed() {
  console.log(`\nPRISMA: 🧻 Наполнение БД фиктивными данными...`)

  await db.users
    .createMany({
      data: arrUser,
      skipDuplicates: true,
    })
    .then(() =>
      console.log('PRISMA: 🚚 Данные - Users - были успешно загружены')
    )
    .catch((error) => {
      console.error(
        'PRISMA: 🚧 Данные - Users - не удалось загрузить в базу\n\n',
        error
      )
    })

  await db.lyrics
    .createMany({
      data: arrConvert,
      skipDuplicates: true,
    })
    .then(() =>
      console.log('PRISMA: 🚚 Данные - Convert - были успешно загружены')
    )
    .catch((error) => {
      console.error(
        'PRISMA: 🚧 Данные - Convert - не удалось загрузить в базу\n\n',
        error
      )
    })
}

seed()
  .then(() => console.log('PRISMA: 🟢 Данные были успешно загружены'))
  .catch((error) => {
    console.error('PRISMA: 🚧 Данные не удалось загрузить в базу\n\n', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
    console.log('PRISMA: 🔌 База данных успешно отключена')
  })
