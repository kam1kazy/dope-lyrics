'use client'

// APOLLO CLIENT
import { ApolloProvider, useQuery } from '@apollo/client'
import client from '@/server/apolloClient'

// STYLES
import { ChakraProvider, Container } from '@chakra-ui/react'

// COMPONENTS
import { AddLyric } from '@/components/addLyric'
import { LyricList } from '@/components/lyricList'

export default function Home() {
  return (
    <ApolloProvider client={client}>
      <ChakraProvider>
        <Container>
          {/* <AddLyric /> */}
          <LyricList />
        </Container>
      </ChakraProvider>
    </ApolloProvider>
  )
}
