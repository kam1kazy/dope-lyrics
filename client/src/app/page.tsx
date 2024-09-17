'use client'

// APOLLO CLIENT
import { ApolloProvider, useQuery } from '@apollo/client'
import client from '@/server/apolloClient'

// STYLES
import { ChakraProvider, Container, Flex } from '@chakra-ui/react'
import { theme } from '../../styles/theme'

// COMPONENTS
import { AddLyric } from '@/components/lyrics/addLyric'
import { LyricList } from '@/components/lyrics/lyricList'
import { Menu } from '@/components/menu/menu'

export default function Home() {
  return (
    <ApolloProvider client={client}>
      <ChakraProvider theme={theme}>
        <Flex
          h='100vh'
          justifyContent={'center'}
          alignItems={'center'}
          overflow={'hidden'}
          background={
            'linear-gradient(45deg, rgb(13, 13, 13), hsl(0, 0%, 0%));'
          }
          color={'#cbccd1'}
          sx={{
            '::before': {
              content: '""',
              position: 'absolute',
              zIndex: '-1,',
              top: '0',
              bottom: '0',
              left: '0',
              right: '0',
              opacity: '0.27',
              backgroundImage: 'url(./noise.png)',
            },
          }}
        >
          <Container
            maxW='340'
            maxH={'640'}
            h={'640'}
            overflow={'scroll'}
            border={'1px solid'}
            borderRadius={'26px'}
            p={0}
            background={'#0f110e'}
            boxShadow={
              ' 0 3px 10px 0 rgba(35, 197, 41, 0.14),0 1px 10px 0 rgba(38, 213, 29, 0.12),0 2px 4px -1px rgba(33, 229, 39, 0.2) inset;'
            }
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'space-between'}
            alignItems={'center'}
            position={'relative'}
            overflowY={'hidden'}
            sx={{
              '::before': {
                content: '""',
                position: 'absolute',
                zIndex: '-1,',
                top: '0',
                bottom: 'auto',
                left: '0',
                right: '0',
                height: '3%',
                opacity: ' 0.45',
                background:
                  'linear-gradient(to top, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%);',
              },
              '::after': {
                content: '""',
                position: 'absolute',
                zIndex: '-1,',
                top: 'auto',
                bottom: '61px',
                left: '0',
                right: '0',
                height: '3%',
                opacity: ' 0.45',
                background:
                  'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%);',
              },
            }}
          >
            {/* <AddLyric /> */}
            <LyricList />
            <Menu />
          </Container>
        </Flex>
      </ChakraProvider>
    </ApolloProvider>
  )
}
