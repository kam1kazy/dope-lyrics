'use client'

// APOLLO CLIENT
import { ApolloProvider, useQuery } from '@apollo/client'
import client from '@/server/apolloClient'

// STYLES
import { ChakraProvider, Container, Flex } from '@chakra-ui/react'

// COMPONENTS
import { AddLyric } from '@/components/addLyric'
import { LyricList } from '@/components/lyricList'

export default function Home() {
  return (
    <ApolloProvider client={client}>
      <ChakraProvider>
        <Flex
          h='100vh'
          justifyContent={'center'}
          alignItems={'center'}
          overflow={'hidden'}
          background={
            'linear-gradient(45deg, rgb(13, 13, 13), hsl(0, 0%, 0%));'
          }
          color={'#cbccd1'}
        >
          <Container
            maxW='340'
            maxH={'640'}
            h={'640'}
            overflow={'scroll'}
            border={'1px solid'}
            borderRadius={'26px'}
            padding={'15px'}
            background={'#0f110e'}
            boxShadow={
              ' 0 4px 5px 0 rgba(35, 197, 41, 0.14),0 1px 10px 0 rgba(38, 213, 29, 0.12),0 2px 4px -1px rgba(33, 229, 39, 0.2);'
            }
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'space-between'}
            alignItems={'center'}
          >
            {/* <AddLyric /> */}
            <LyricList />
          </Container>
        </Flex>
      </ChakraProvider>
    </ApolloProvider>
  )
}
