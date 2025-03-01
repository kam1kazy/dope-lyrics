import { ApolloClient, InMemoryCache, ApolloLink, createHttpLink } from '@apollo/client'
import { setContext } from "@apollo/client/link/context";

const authLink = setContext((_, { headers }) => {
  // Получаем токен из локального хранилища или другого источника
  const token = localStorage.getItem('token'); // Замените на ваш способ получения токена
  console.log('apollo cloent token', token)
  // Возвращаем заголовки, включая токен авторизации

  if(!token) {
    console.warn('Token not found')
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : 'supersecretkey',
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
