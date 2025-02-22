import { ApolloClient, InMemoryCache } from '@apollo/client'

console.log(process.env.NEXT_PUBLIC_BASE_URL)
const client = new ApolloClient({
  uri:
    `${process.env.NEXT_PUBLIC_BASE_URL}/graphql` ||
    'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
})

export default client
