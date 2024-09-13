import { PrismaClient } from '@prisma/client'

// Типы
import { UserType, LyricType } from '../../src/types/index'

// Дата
import chatHistory from '../../bot-data/data/chatHistory.json'
import chatUser from '../../bot-data/data/usersData.json'

const db = new PrismaClient()

// const arrHistory: DataType[] = chatHistory
const arrUser: UserType[] = chatUser

async function seed() {
  console.log(`\nPRISMA: 🧻 Наполнение БД фиктивными данными...`)

  await db.users.createMany({
    data: arrUser,
    skipDuplicates: true,
  })

  console.log('PRISMA: 🚚 Данные - Users - были успешно загружены')

  await db.lyrics.create({
    data: {
      userId: 0,

      message: {
        create: {
          id: 2,
          text: 'im king Dope',
          word_count: 7,
          paragraph_count: 2,
          reactions: {
            create: {
              uniqueCount: 2,
              totalFreeCount: 2,
              totalPaidCount: 0,
              totalCount: 2,
              Emoji: {
                create: [
                  {
                    emoji: 'kk',
                    isPaid: false,
                    count: 1,
                    order: 0,
                  },
                  {
                    emoji: '🆒',
                    isPaid: false,
                    count: 1,
                    order: null,
                  },
                ],
              },
            },
          },
          hashtags: {
            create: {
              hashtags: ['text', 'test', 'tag', 'бляяяяя'],
              count: 4,
            },
          },
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
      date: '2024-09-12T04:22:38.000Z',
      editDate: '2024-09-12T04:22:42.000Z',
      isPinned: false,
      isChannelPost: true,
      replyToMessage: {},
      media: {},
    },
  })

  console.log('PRISMA: 🚚 Данные - Lyrics - были успешно загружены')
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
