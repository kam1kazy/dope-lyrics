import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from "@apollo/client/link/context";
import { onError } from '@apollo/client/link/error';
import { gql } from '@apollo/client';


// const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
//   if (graphQLErrors) {
//     for (let err of graphQLErrors) {
//       if (err.message === 'Неверный или истекший токен') {
//         return refreshToken().then(newToken => {
//           operation.setContext(({ headers = {} }) => ({
//             headers: {
//               ...headers,
//               authorization: `Bearer ${newToken}`,
//             },
//           }));
//           return forward(operation);
//         });
//       }
//     }
//   }
// });


async function refreshToken() {
  const refreshToken = document.cookie.match(/refresh_token=([^;]+)/)?.[1];
  if (!refreshToken) throw new Error('Refresh token не найден');

  const { data } = await client.mutate({
    mutation: gql`
      mutation RefreshToken($refreshToken: String!) {
        refreshToken(refreshToken: $refreshToken) {
          token
        }
      }
    `,
    variables: { refreshToken },
  });

  return data.refreshToken.token;
}

const authLink = setContext((_, { headers }) => {
  // Получаем токен из локального хранилища или другого источника
  // const token = localStorage.getItem('token'); // Замените на ваш способ получения токена
  const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

  if(!token) {
    console.warn('Token not found')
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

const link = createHttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include'
});



// Создаем Apollo Client с добавленным authLink
const client = new ApolloClient({
  link: authLink.concat(link),
  cache: new InMemoryCache(),
})

export default client
