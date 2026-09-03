import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';

import { getTelegramInitData } from '@/shared/lib/telegram-webapp';

const graphqlUri = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/graphql`;

const telegramInitDataLink = new ApolloLink((operation, forward) => {
  const initData = getTelegramInitData();
  if (initData) {
    operation.setContext((previous) => ({
      headers: {
        ...previous.headers,
        'X-Telegram-Init-Data': initData,
      },
    }));
  }

  return forward(operation);
});

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: telegramInitDataLink.concat(
    new HttpLink({
      uri: graphqlUri,
      credentials: 'include',
    })
  ),
});
