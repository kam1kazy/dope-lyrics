// TYPES
import { ILyric } from '@server/types/lyric'

type LyricItem = Pick<ILyric, 'message' | 'lyric_id'>

interface IViewportLyricList {
  lyric_id: LyricItem['lyric_id']
  message: LyricItem['message']
}

export const CreateArrListCarousel = (data: ILyric[]) => {
  let arr: IViewportLyricList[] = []

  // Формирование массива для карусели
  for (let i = 0; i < data.length; i++) {
    if (data[i].message?.text == '') {
      continue
    }

    // Формирование массива с разделением сообщений по строкам
    let newTextList: string[] | undefined =
      data[i].message?.text != undefined
        ? data[i].message?.text.split('\n')
        : undefined

    // Добавляем новый элемент в массив
    if (newTextList) {
      for (let n = 0; n < newTextList.length; n++) {
        let newItem: IViewportLyricList = {
          lyric_id: data[i].lyric_id,
          message: {
            message_id: n,
            text: newTextList[n],
            hashtags: data[i].message?.hashtags,
            reactions: data[i].message?.reactions,
          },
        }

        arr.push(newItem)
      }
    }
  }

  // Почему то верхнее условие не работает и пустые сообщения попадают в массив
  const filterArr: IViewportLyricList[] = arr.filter(
    (item: IViewportLyricList) => item.message?.text != ''
  )

  return filterArr
}
