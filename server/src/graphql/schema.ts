import { createSchema, createYoga, type Plugin } from 'graphql-yoga';

import { env, isProduction } from '../config/env';
import { createContext } from './context';
import { maxDepthRule } from './max-depth';
import { resolvers } from './resolvers';
import { typeDefinitions } from './typeDefs';

export const graphqlPath = 'graphql';

const executableSchema = createSchema({
  typeDefs: typeDefinitions,
  resolvers,
});

const maxDepthPlugin: Plugin = {
  onValidate({ addValidationRule }) {
    addValidationRule(maxDepthRule(env.GRAPHQL_MAX_DEPTH));
  },
};

export const yoga = createYoga({
  schema: executableSchema,
  context: createContext,
  graphqlEndpoint: `/${graphqlPath}`,
  graphiql: !isProduction,
  maskedErrors: isProduction,
  plugins: [maxDepthPlugin],
});
