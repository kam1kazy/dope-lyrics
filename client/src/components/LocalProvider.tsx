'use client';

// APOLLO CLIENT
import { ApolloProvider } from '@apollo/client';
import client from '@/lib/apolloClient';

// STYLES
import { ChakraProvider } from '@chakra-ui/react'
import { theme } from '../../styles/theme'


export default function LocalProvider({ children }: { children: React.ReactNode }) {
  return (
      <ApolloProvider client={client}>
        <ChakraProvider theme={theme}>
            {children}
        </ChakraProvider>
      </ApolloProvider>
  );
}