import { VStack, Spinner } from '@chakra-ui/react'
import { useQuery } from '@apollo/client'

import { LyricItem } from './lyricItem'
import { TotalCount } from './totalCount'
import { ALL_LYRICS } from '@/server/lyrics'

export const LyricList = () => {
  const { loading, error, data } = useQuery(ALL_LYRICS, {
    onError: (error) => {
      console.error('Error fetching ' + data + '  lyrics:', error)
    },
  })

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <h2>Error...</h2>
  }

  return (
    <VStack
      spacing={2}
      mt={4}
      overflowY={'scroll'}
      padding={'15'}
      maxH={'575px'}
      margin={'auto'}
      textAlign={'center'}
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
