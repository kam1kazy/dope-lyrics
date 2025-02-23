import process from 'node:process'
import dotenv from 'dotenv'
import path from 'path'

// Загружаем переменные окружения из .env файла
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API_ID = Number.parseInt(process.env.API_ID ?? '')
const API_HASH = process.env.API_HASH ?? ''
const BOT_TOKEN = process.env.BOT_TOKEN ?? ''
const BOT_PHONE = process.env.BOT_PHONE ?? ''
const BOT_PASS = process.env.BOT_PASS ?? ''
const BOT_CHAT_ID = Number.parseInt(process.env.BOT_CHAT_ID ?? '')
const BOT_CHANNEL_ID = Number.parseInt(process.env.BOT_CHANNEL_ID ?? '')
const BOT_ADMIN_ID = Number.parseInt(process.env.BOT_ADMIN_ID ?? '')
const BOT_TYPE = process.env.BOT_TYPE ?? ''

const SITE_URL = process.env.SITE_URL ?? ''

// Проверяем все необходимые переменные окружения
if (Number.isNaN(API_ID) || !API_HASH) {
  throw new Error('API_ID или API_HASH не установлены!')
}

if (
  !BOT_TOKEN ||
  !BOT_PHONE ||
  !BOT_PASS ||
  Number.isNaN(BOT_CHAT_ID) ||
  Number.isNaN(BOT_CHANNEL_ID)
) {
  throw new Error('Отсутствуют необходимые переменные окружения для бота!')
}

export {
  API_HASH,
  API_ID,
  BOT_TOKEN,
  BOT_PHONE,
  BOT_CHAT_ID,
  BOT_PASS,
  BOT_CHANNEL_ID,
  BOT_TYPE,
  BOT_ADMIN_ID,
  SITE_URL,
}
