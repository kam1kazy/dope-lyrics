// src/graphql/schema.ts
import { typeDefinitions } from './querys';
import { resolvers } from './resolvers';
import { createContext } from './context';
import { useJWT } from '@graphql-yoga/plugin-jwt';
import { useCookies } from '@whatwg-node/server-plugin-cookies';

export const schema = {
  typeDefs: typeDefinitions,
  resolvers,
  context: async ({ request }: { request: Request }) => {
    return createContext({ request });
  },
  plugins: [
    // useCookies(),
    // useJWT({
    //   signingKeyProviders: [() => process.env.JWT_SECRET || 'supersecretkey'],
    //   tokenLookupLocations: [
    //     ({ request }) => {
    //       console.log('request в схеме', request);
    //       const token = request.headers.get('Authorization')?.split(' ')[1];
    //       console.log('token в схеме', token);
    //       return token ? { token } : undefined;
    //     },
    //   ],
    // }),
  ],
  path: 'graphql',
};