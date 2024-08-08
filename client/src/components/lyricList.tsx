import { VStack, Spinner } from '@chakra-ui/react'
import { useQuery } from '@apollo/client'

import { LyricItem } from './lyricItem'
import { TotalCount } from './totalCount'
import { ALL_LYRICS } from '@/apollo/lyrics'

export const LyricList = () => {
  const { loading, error, data } = useQuery(ALL_LYRICS)

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <h2>Error...</h2>
  }

  console.log(data.allLyrics)

  return (
    <VStack spacing={2} mt={4}>
      {data?.allLyrics.map((lyric: any) => (
        <LyricItem key={lyric.id} {...lyric} />
      ))}
      <TotalCount count={data?.allLyrics.length} />
    </VStack>
  )
}
