import { VStack } from '@chakra-ui/react'
import { useQuery } from '@apollo/client'

import { ErrorText } from './system/error'
import { Spinner } from './system/spinner'
import { LyricItem } from './lyricItem'
import { TotalCount } from './totalCount'
import { Viewport } from './viewport/viewport'

import { ALL_LYRICS } from '@/server/lyrics'

import { useRef, useCallback, useEffect } from 'react'

export const LyricList = () => {
  const ref = useRef<HTMLDivElement>(null)

  const { loading, error, data } = useQuery(ALL_LYRICS, {
    onError: (error) => {
      console.error('Error fetching ' + data + '  lyrics:', error)
    },
  })

  if (loading) {
    return <Spinner count={125} duration={900} size={0.375} />
  }

  if (error) {
    return <ErrorText title={'Error'} />
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

      <Viewport data={data.lyrics} />

      <TotalCount count={data?.lyrics.length} />
    </VStack>
  )
}
