import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';
import { ServerError } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';

import { getTelegramInitData } from '@/shared/lib/telegram-webapp';

import { AUTH_SIGNED_OUT_EVENT } from './auth-api';

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

const signedOutLink = new ErrorLink(({ error }) => {
  if (
    typeof window === 'undefined' ||
    !ServerError.is(error) ||
    error.statusCode !== 401
  ) {
    return;
  }

  apolloClient.clearStore().catch(() => {
    // in-flight queries reject on clear
  });
  window.dispatchEvent(new Event(AUTH_SIGNED_OUT_EVENT));
});

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: ApolloLink.from([
    signedOutLink,
    telegramInitDataLink,
    new HttpLink({
      uri: graphqlUri,
      credentials: 'include',
    }),
  ]),
});
