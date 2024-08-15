'use client'

import { ApolloProvider } from '@apollo/client'
import client from '@/server/apolloClient'
import { ChakraProvider, Container } from '@chakra-ui/react'

import { AddLyric } from '@/components/addLyric'
import { LyricList } from '@/components/lyricList'

export default function Home() {
  fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
          query Trap {
            lyrics {
              id
            }
          }
        `,
      variables: {
        now: new Date().toISOString(),
      },
    }),
  })
    .then((res) => res.json())
    .then((result) => console.log(result))

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
