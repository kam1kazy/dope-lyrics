import { PrismaClient } from '@prisma/client'

// Типы
import {
  ChatHistoryType,
  ReactionType,
  MediaType,
  Data,
} from '../../src/types/index'

// Дата
import chatHistory from '../../bot-data/data/chatHistory.json'

const db = new PrismaClient()

const arrHistory: Data[] = chatHistory

async function seed() {
  await db.lyrics.createMany({
    data: arrHistory,
  })
}

seed()
  .then(() => console.log('🚚 Данные были успешно загружены'))
  .catch((error) => {
    console.error('🚧 Данные не удалось загрузить данные', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
    console.log('🔌 База данных успешно отключена')
  })
