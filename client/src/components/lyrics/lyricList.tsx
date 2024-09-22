import { useRef } from 'react'
import { useQuery } from '@apollo/client'

// STYLES
import { VStack } from '@chakra-ui/react'

// COMPONENTS
import { ErrorText } from './system/error'
import { Spinner } from './system/spinner'
import { TotalCount } from './totalCount'
import { Viewport } from './viewport/viewport'

// GRAPHQL
import { ALL_LYRICS } from '@/server/lyrics'

// HANDLERS
import { CreateArrListCarousel } from '@/handlers/createArrListCarousel'

export const LyricList = () => {
  const ref = useRef<HTMLDivElement>(null)

  let carouselList: any[] = []

  const { loading, error, data } = useQuery(ALL_LYRICS, {
    onError: (error) => {
      console.error('Ошибка запроса ' + data + '  lyrics:', error)
    },
  })

  if (loading) {
    return <Spinner count={125} duration={900} size={0.375} />
  }

  if (error) {
    return <ErrorText title={'Error'} />
  }

  if (data) {
    carouselList = CreateArrListCarousel(data.lyrics)
  } else {
    console.error(
      'Не удалось создать список: \n\n' + data + '\n\nlyrics:',
      error
    )
    return (
      <ErrorText title={'Error'} description={'Не удалось создать список'} />
    )
  }

  return (
    <VStack
      ref={ref}
      spacing={2}
      margin={'auto'}
      m={0}
      padding={'15'}
      maxH={'590px'}
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
          backgroundColor: 'red',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'yellow',
        },
      }}
    >
      <h1>Dope Lyrics</h1>
      <h1>****</h1>

      <Viewport data={carouselList} />

      <TotalCount count={data.lyrics.length} />
    </VStack>
  )
}
