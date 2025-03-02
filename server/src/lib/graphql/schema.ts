// src/graphql/schema.ts
import { typeDefinitions } from './querys';
import { resolvers } from './resolvers';
import { createContext } from './context';

export const schema = {
  typeDefs: typeDefinitions,
  resolvers,
  context: async ({ request }: { request: Request }) => {
    return createContext({ request });
  },
  // validationRules: [limitToFields(10), depthLimit(5)], // Пример ограничений
  // introspection: process.env.NODE_ENV === 'development', // Отключить в продакшене
  path: '/graphql',
};