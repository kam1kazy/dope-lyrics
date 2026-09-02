import { env, isProduction } from '../config/env';
import { createContext } from './context';
import { maxDepthRule } from './max-depth';
import { typeDefinitions } from './querys';
import { resolvers } from './resolvers';

const pathApi = 'graphql';

export const schema = {
  typeDefs: typeDefinitions,
  context: createContext,
  resolvers,
  path: pathApi,
  graphiql: !isProduction,
  maskedErrors: isProduction,
  plugins: [
    {
      onValidate({
        addValidationRule,
      }: {
        addValidationRule: (rule: ReturnType<typeof maxDepthRule>) => void;
      }) {
        addValidationRule(maxDepthRule(env.GRAPHQL_MAX_DEPTH));
      },
    },
  ],
};
