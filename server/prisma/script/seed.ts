import { PrismaClient } from '@prisma/client'
const fs = require('fs')
const path = require('path')

// Типы
import { ILyric } from '../../src/types/lyric'
import { IUser } from '../../src/types/user'
import { IChatHistoryItem } from '../../src/types/prismaCreate'

const chatHistoryPath = path.resolve(
  __dirname,
  '../../bot-data/data/chatHistory.json'
)
const chatUserPath = path.resolve(
  __dirname,
  '../../bot-data/data/usersData.json'
)
let chatHistory: IChatHistoryItem[] = null
let chatUser: IUser[] = null

// Дата базы
const db = new PrismaClient()

console.log('DATABASE_URL in seed.ts:', process.env.DATABASE_URL)

async function seed() {
  console.log(`\nPRISMA: 🧻 Запись данных в базу...`)

  // Проверяем на наличие и достаем пользователя из базы данных
  let userExists = await db.users.findUnique({
    where: {
      id: 0, // значение userId - это пользователь которому принадлежат данные
    },
  })

  // Добавляем пользователей
  if (fs.existsSync(chatUser)) {
    chatUser = require(chatUserPath)

    console.log(`\nPRISMA: 🙅 Users не был найден`)
    console.log(`PRISMA: 📝 Создание пользователей...`)

    await db.users
      .createMany({
        data: chatUser,
        skipDuplicates: true,
      })
      .then(() =>
        console.log(
          'PRISMA: 🚚 Данные Users - в кол-ве ' +
            chatUser.length +
            ' были успешно созданы'
        )
      )
      .catch((error) => {
        console.error(
          'PRISMA: 🚧 Данные - Users - не удалось загрузить в базу\n\n',
          error
        )
      })

    userExists = await db.users.findUnique({
      where: {
        id: 0, // значение userId - это пользователь которому принадлежат данные
      },
    })
  }

  // Счетчик для цикла прохода по истории чата
  let successCount = 0

  // Цикл создает по одной записи за раз
  if (fs.existsSync(chatHistoryPath)) {
    chatHistory = require(chatHistoryPath)

    for (const item of chatHistory) {
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

        // Создаем запись
        await db.lyrics.create({
          data: {
            //? LYRICS
            userId: userExists.id,
            lyric_id: message?.message_id ?? null,
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
                          create: {
                            tags: message.hashtags.tags.map((tag) => tag),
                            count: message.hashtags.count,
                          },
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
  } else {
    console.log(`\nPRISMA: 🧻 Данные History не были найдены`)
  }

  if (fs.existsSync(chatHistoryPath) && successCount === chatHistory.length) {
    console.log(
      `PRISMA: 🚚 Данные Lyrics - в кол-ве ${chatHistory.length} успешно созданы`
    )
  } else {
    console.log(`\nPRISMA:🚧 chatHistory не был найден или пустой`)
  }
}

seed()
  .then(() => console.log('\nPRISMA: 🟢 Данные были успешно загружены'))
  .catch((error) => {
    console.error('PRISMA: 🚧 Данные не удалось загрузить в базу\n\n', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
    console.log('PRISMA: 🔌 База данных успешно отключена')
  })
