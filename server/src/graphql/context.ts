import { prisma } from '../infrastructure/prisma';

export type GraphQLContext = {
  prisma: typeof prisma;
};

export async function createContext(): Promise<GraphQLContext> {
  return { prisma };
}
