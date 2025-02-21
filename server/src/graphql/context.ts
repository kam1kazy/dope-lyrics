import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
console.log('context.ts Prisma initialized with:', process.env.DATABASE_URL)

export type GraphQLContext = {
  prisma: PrismaClient
}

export async function createContext(): Promise<GraphQLContext> {
  console.log('Creating context')
  return { prisma }
}
