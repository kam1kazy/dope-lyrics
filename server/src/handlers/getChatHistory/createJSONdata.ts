import fs from 'fs'
import path from 'path'

// TYPES
import { ILyric } from '../../types/lyric'

// Создаем JSON файл с данными
export const createJSONdata = (chatHistory: ILyric[]) => {
  const jsonData = JSON.stringify(chatHistory, null, 2)

  const dirName = path.join(__dirname, '../../../bot-data', 'data')
  const fileName = 'chatHistory.json'
  const fullPath = path.join(dirName, fileName)

  fs.mkdir(dirName, { recursive: true }, (err) => {
    if (err) {
      console.error('\nMTCUTE: 🛑 Ошибка создание папки', err)
    } else {
      fs.writeFile(fullPath, jsonData, (err) => {
        if (err) {
          console.error('\nMTCUTE: 🛑 Ошибка создание файла', err)
        } else {
          console.log(
            `MTCUTE: 🟢 Файл с историей чата успешно создан в ${fullPath}\n`
          )
        }
      })
    }
  })
}
