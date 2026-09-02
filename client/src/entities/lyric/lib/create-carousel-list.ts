import type { ILyric, LyricSlide } from '../model/types';

export const createCarouselList = (data: ILyric[]): LyricSlide[] => {
  const arr: LyricSlide[] = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].message?.text === '') {
      continue;
    }

    const newTextList: string[] | undefined =
      data[i].message?.text !== undefined
        ? data[i].message?.text.split('\n')
        : undefined;

    if (newTextList) {
      for (let n = 0; n < newTextList.length; n++) {
        const newItem: LyricSlide = {
          lyric_id: data[i].lyric_id,
          message: {
            message_id: n,
            text: newTextList[n],
            hashtags: data[i].message?.hashtags,
            reactions: data[i].message?.reactions,
          },
        };

        arr.push(newItem);
      }
    }
  }

  return arr.filter((item: LyricSlide) => item.message?.text !== '');
};
