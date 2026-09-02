'use client';

import { useQuery } from '@apollo/client';
import { VStack } from '@chakra-ui/react';
import { useRef } from 'react';

import {
  ALL_LYRICS,
  createCarouselList,
  type ILyric,
  type LyricSlide,
  TotalCount,
} from '@/entities/lyric';
import { ErrorText } from '@/shared/ui/error-text';
import { Spinner } from '@/shared/ui/spinner';

import { Viewport } from './viewport';

export const LyricList = () => {
  const ref = useRef<HTMLDivElement>(null);

  let carouselList: LyricSlide[] = [];

  const { loading, error, data } = useQuery<{ lyrics: ILyric[] }>(ALL_LYRICS, {
    onError: (queryError) => {
      console.error('Ошибка запроса ' + data + '  lyrics:', queryError);
    },
  });

  if (loading) {
    return <Spinner count={125} duration={900} size={0.375} />;
  }

  if (error) {
    return <ErrorText title={'Error'} />;
  }

  if (!data?.lyrics?.length) {
    return <ErrorText title={'Empty'} description={'Список пуст'} />;
  }

  if (data) {
    carouselList = createCarouselList(data.lyrics);
  } else {
    console.error(
      'Не удалось создать список: \n\n' + data + '\n\nlyrics:',
      error
    );
    return (
      <ErrorText title={'Error'} description={'Не удалось создать список'} />
    );
  }

  return (
    <VStack
      ref={ref}
      spacing={2}
      margin={'auto'}
      m={0}
      padding={'15'}
      w={'100%'}
      h={'100%'}
      overflowY={'scroll'}
      textAlign={'center'}
      wordBreak={'keep-all'}
      boxShadow={'0px 0px 17px 0px rgba(34, 60, 80, 0.35) inset'}
      overflowX={'hidden'}
      fontSize={'14px'}
      sx={{
        '&::-webkit-scrollbar': {
          width: '10px',
          height: '10px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(34, 60, 80, 0.35)',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
      }}
    >
      <h1>Dope Lyrics</h1>
      <h1>****</h1>

      <Viewport data={carouselList} />

      <TotalCount count={data.lyrics.length} />
    </VStack>
  );
};
