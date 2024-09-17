import { VStack } from '@chakra-ui/react'
import { useQuery } from '@apollo/client'

import { LyricItem } from './lyricItem'
import { TotalCount } from './totalCount'
import { ErrorText } from './system/error'
import { Spinner } from './system/spinner'

import { ALL_LYRICS } from '@/server/lyrics'

export const LyricList = () => {
  const { loading, error, data } = useQuery(ALL_LYRICS, {
    onError: (error) => {
      console.error('Error fetching ' + data + '  lyrics:', error)
    },
  })

  if (loading) {
    return <Spinner count={65} duration={900} size={0.375} />
  }

  if (error) {
    return <ErrorText title={'Error'} />
  }

  return (
    <VStack
      spacing={2}
      margin={'auto'}
      m={0}
      padding={'15'}
      maxH={'590px'}
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
      {data?.lyrics.map((lyric: any) => (
        <LyricItem key={lyric.id} {...lyric} />
      ))}
      <TotalCount count={data?.lyrics.length} />
    </VStack>
  )
}
