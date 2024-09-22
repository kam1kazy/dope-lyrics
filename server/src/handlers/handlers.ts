import { IEmoji } from '../types/lyric'
import { IHashtagData } from '../types/dataMessage'

// Кол-во слов
const handlerCountWords = (lyric: string) => {
  const words = lyric.trim().split(/\s+/)
  return Number(words.filter((word) => word.length > 0).length)
}

// Кол-во абзацев
const handlerCountParagraphs = (lyric: string) => {
  const paragraphs = lyric.split(/[\r\n]+/)
  return Number(
    paragraphs.filter((lyric: string) => lyric.trim().length > 0).length
  )
}

// Кол-во всех реакций с учетом повторений
const handlerCountReactions = (
  reactions: IEmoji[],
  type: 'total' | 'paid' | 'free'
) => {
  const totalCount = reactions.reduce((total: number, reaction) => {
    if (type === 'total') return total + reaction.count
    if (type === 'paid') return reaction.isPaid ? total + reaction.count : total
    if (type === 'free')
      return !reaction.isPaid ? total + reaction.count : total

    return total
  }, 0)

  try {
    return totalCount
  } catch (error) {
    return console.error(
      `\nMTCUTE: 🛑 Ошибка подсчета ${type} реакций:\n\n`,
      error
    )
  }
}

// Вырезать хэштеги из строки с текстом
const handlerWithoutHashtags = (lyric: string) => {
  return lyric.replace(/\s*#[^\s]+/g, '').trim()
}

// Вырезать хэштеги из массива объектов
const hashtagStringsOnly = (data: IHashtagData[]) => {
  const hashtagStrings: string[] = data.map((hashtag: IHashtagData) =>
    hashtag.text.replace(/^#/, '')
  )

  return hashtagStrings
}

// Отправить в определенный чат
const sendToBotChat = ({ text, chatId, tg }: any) => {
  tg.sendText(chatId, 'MTCUTE [CMD]: 💳 Chat ID     ' + text.toString())
}

export {
  handlerCountParagraphs,
  handlerCountWords,
  handlerCountReactions,
  handlerWithoutHashtags,
  hashtagStringsOnly,
  sendToBotChat,
}
