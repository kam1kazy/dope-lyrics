import fs from 'fs'

// TYPES
import { ConvertDataType } from '../types'

// Конвертируем JSON файл с данными
export const createConvertData = (chatHistory: ConvertDataType) => {
  const jsonData = JSON.stringify(chatHistory, null, 2)

  const dirName = 'bot-data/data'
  const fileName = 'convertHistory.json'
  const fullPath = `${dirName}/${fileName}`

  fs.mkdir(dirName, { recursive: true }, (err) => {
    if (err) {
      console.error('\nPRISMA: 🛑 Ошибка создание папки\n\n', err)
    } else {
      fs.writeFile(fullPath, jsonData, (err) => {
        if (err) {
          console.error('\nPRISMA: 🛑 Ошибка создание файла\n\n', err)
        } else {
          console.log(
            `PRISMA: 🟢 Конвертированный файл с историей чата успешно создан в ${fullPath}\n`
          )
        }
      })
    }
  })
}
