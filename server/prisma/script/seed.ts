import { PrismaClient } from '@prisma/client'

// Типы
import { UserType, LyricType } from '../../src/types/index'

// Дата
const chatUser = require('../../bot-data/data/usersData.json')
const chatHistory = require('../../bot-data/data/chatHistory.json')

const db = new PrismaClient()

const arrUser: UserType[] = chatUser
const arrHistory = chatHistory

async function seed() {
  console.log(`\nPRISMA: 🧻 Запись...`)

  await db.users
    .createMany({
      data: arrUser,
      skipDuplicates: true,
    })
    .then(() =>
      console.log(
        'PRISMA: 🚚 Данные Users - в кол-ве ' +
          arrUser.length +
          ' были успешно загружены'
      )
    )
    .catch((error) => {
      console.error(
        'PRISMA: 🚧 Данные - Users - не удалось загрузить в базу\n\n',
        error
      )
    })

  const userExists = await db.users.findUnique({
    where: {
      id: 1, // значение userId, которое вы хотите использовать
    },
  })

  if (!userExists) {
    throw new Error('\nPRISMA: 🙅 User не был найден')
  }

  // Счетчик для цикла прохода по истории чата
  let successCount = 0

  for (const item of arrHistory) {
    try {
      const {
        date,
        editDate,
        isPinned,
        isChannelPost,
        message,
        user,
        chat,
        replyToMessage,
        media,
      } = item

      const lyrics = await db.lyrics.create({
        data: {
          //? LYRICS
          userId: userExists.id,
          date: date,
          editDate: editDate,
          isPinned,
          isChannelPost,

          //? MESSAGE
          message: message
            ? {
                create: {
                  text: message.text,
                  message_id: message.message_id,
                  word_count: message.word_count,
                  paragraph_count: message.paragraph_count,

                  //? REACTION
                  reactions: message.reactions
                    ? {
                        create: {
                          uniqueCount: message.reactions.uniqueCount,
                          totalFreeCount: message.reactions.totalFreeCount,
                          totalPaidCount: message.reactions.totalPaidCount,
                          totalCount: message.reactions.totalCount,
                          emojis: {
                            create: message.reactions.emojis,
                          },
                        },
                      }
                    : undefined,

                  //? HASHTAG
                  hashtags: message.hashtags
                    ? {
                        create: message.hashtags,
                      }
                    : undefined,
                },
              }
            : undefined,

          //? USERS
          user: user
            ? {
                create: {
                  id: user.id,
                  username: user.username,
                  displayName: user.displayName,
                  isAdmin: user.isAdmin,
                },
              }
            : undefined,

          //? CHAT
          chat: chat
            ? {
                create: {
                  id: chat.id,
                  title: chat.title,
                  type: chat.type,
                },
              }
            : undefined,

          //? REPLY
          replyToMessage: replyToMessage ?? null,

          //? MEDIA
          media: media
            ? {
                create: {
                  mime: media.mime,
                  duration: media.duration,
                  convert: media.convert,
                },
              }
            : undefined,
        },
      })

      successCount++
    } catch (error) {
      console.error(
        'PRISMA: 🚧 Данные Lyrics - Iter: #' +
          successCount +
          ' - не удалось загрузить в базу\n\n',
        error
      )
    }
  }

  if (successCount === arrHistory.length) {
    console.log(
      `PRISMA: 🚚 Данные Lyrics - в кол-ве ${arrHistory.length} успешно созданы`
    )
  } else {
    console.log(
      `\nPRISMA:🚧 Создано ${successCount} из ${arrHistory.length} записей`
    )
  }
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
