import { ApolloClient, InMemoryCache, createHttpLink, Observable } from '@apollo/client'
import { setContext } from "@apollo/client/link/context";
import { onError } from '@apollo/client/link/error';
import { gql } from '@apollo/client';

// Функция для получения токена из куки
const getTokenFromCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null; // Проверка для SSR
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Функция для обновления токена
async function refreshToken() {
  const refreshToken = getTokenFromCookie('refresh_token');
  if (!refreshToken) throw new Error('Refresh token не найден');

  try {
    const { data } = await client.mutate({
      mutation: gql`
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            sessionToken
          }
        }
      `,
      variables: { refreshToken },
    });

    return data.refreshToken.sessionToken;
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    throw error;
  }
}

// Обработка ошибок, включая обновление токена при необходимости
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (let err of graphQLErrors) {
      if (err.message === 'Неверный или истекший токен') {
        // Пытаемся обновить токен и повторить запрос
        return new Observable(observer => {
          refreshToken()
            .then(newToken => {
              operation.setContext(({ headers = {} }) => ({
                headers: {
                  ...headers,
                  authorization: `Bearer ${newToken}`,
                },
              }));
              
              // Повторяем запрос с новым токеном
              const subscriber = {
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              };
              
              forward(operation).subscribe(subscriber);
            })
            .catch(error => {
              observer.error(error);
              console.error('Не удалось обновить токен:', error);
              // Перенаправляем на страницу входа при ошибке обновления токена
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            });
        });
      }
    }
  }
  
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Добавление токена к каждому запросу
const authLink = setContext((_, { headers }) => {
  // Получаем токен из куки
  const token = getTokenFromCookie('token');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Создаем HTTP-линк для GraphQL
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include' // Важно для передачи кук
});

// Создаем Apollo Client с добавленными линками
const client = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
});

export default client;
