import { ApolloClient, InMemoryCache } from '@apollo/client'

const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache(),
  credentials: 'include',
})

export default client
