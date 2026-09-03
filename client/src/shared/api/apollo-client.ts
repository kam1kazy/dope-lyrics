import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

const graphqlUri = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/graphql`;

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: graphqlUri,
    credentials: 'include',
  }),
});
