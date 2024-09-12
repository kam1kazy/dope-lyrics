import process from 'node:process'

const API_ID = Number.parseInt(process.env.API_ID!)
const API_HASH = process.env.API_HASH!
const BOT_TOKEN = process.env.BOT_TOKEN!
const BOT_PHONE = process.env.BOT_PHONE!
const BOT_PASS = process.env.BOT_PASS!
const BOT_CHAT_ID = Number.parseInt(process.env.BOT_CHAT_ID!)

if (Number.isNaN(API_ID) || !API_HASH) {
  throw new Error('API_ID or API_HASH not set!')
}

export { API_HASH, API_ID, BOT_TOKEN, BOT_PHONE, BOT_CHAT_ID, BOT_PASS }
