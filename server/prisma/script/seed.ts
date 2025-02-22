const fs = require('fs')
const path = require('path')

// Сервисы
import { prismaService } from '~/services/db'

// Типы
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

const chatUser: IUser[] = require(chatUserPath)
const chatHistory: IChatHistoryItem[] = require(chatHistoryPath)

const seed = async () => {
  console.log(`\nPRISMA: 🌾 Выполняем посев данных...`)

  // Проверяем существование файлов с данными
  if (!fs.existsSync(chatUserPath)) {
    console.log('PRISMA: ⚠️ Файлы с данными пользователей не найдены')
    return
  }
  // Добавляем пользователей
  if (fs.existsSync(chatUserPath)) {
    await prismaService.loadUsers(chatUser)
  }

  // Проверяем существование файлов с данными
  if (!fs.existsSync(chatHistoryPath)) {
    console.log('PRISMA: ⚠️ Файлы с данными истории не найдены')
    return
  }

  // Добавляем записи чата в базу
  if (chatHistory?.length) {
    await prismaService.loadNewRecords(chatHistory)
  }
}

export default seed
