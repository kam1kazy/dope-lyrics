import { resolvers } from './resolvers'
import { typeDefinitions } from './querys'
import { createContext } from './context'

const pathApi: string = 'graphql'

export const schema = {
  typeDefs: typeDefinitions,
  context: createContext,
  resolvers,
  path: pathApi,
}
