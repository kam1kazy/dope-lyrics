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
      const lines = newTextList.filter((line) => line !== '');

      for (let n = 0; n < lines.length; n++) {
        const newItem: LyricSlide = {
          lyric_id: data[i].lyric_id,
          message: {
            message_id: n,
            text: lines[n],
            hashtags: n === 0 ? data[i].message?.hashtags : null,
            reactions: n === 0 ? data[i].message?.reactions : null,
          },
        };

        arr.push(newItem);
      }
    }
  }

  return arr.filter((item: LyricSlide) => item.message?.text !== '');
};
