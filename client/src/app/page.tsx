'use client'

import { ApolloProvider } from '@apollo/client'
import client from '@/server/apolloClient'
import { ChakraProvider, Container } from '@chakra-ui/react'

import { AddLyric } from '@/components/addLyric'
import { LyricList } from '@/components/lyricList'

export default function Home() {
  return (
    <ApolloProvider client={client}>
      <ChakraProvider>
        <Container>
          <AddLyric />
          <LyricList />
        </Container>
      </ChakraProvider>
    </ApolloProvider>
  )
}
