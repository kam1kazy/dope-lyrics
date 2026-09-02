'use client';

import { Container, Flex } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Flex
      h="100vh"
      justifyContent={'center'}
      alignItems={'center'}
      overflow={'hidden'}
      background={'linear-gradient(45deg, rgb(13, 13, 13), hsl(0, 0%, 0%));'}
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
        maxW={'640'}
        maxH={'1200'}
        h={'100%'}
        overflow={'scroll'}
        p={0}
        background={'#0f110e'}
        display={'flex'}
        flexDirection={'column'}
        justifyContent={'space-between'}
        alignItems={'center'}
        position={'relative'}
        overflowY={'hidden'}
        style={{ scrollbarWidth: 'none' }}
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
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        }}
      >
        {children}
      </Container>
    </Flex>
  );
}
