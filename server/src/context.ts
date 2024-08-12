import { PrismaClient } from '@prisma/client'
import { LyricType } from './types/lyrics'

const db = new PrismaClient()

// export type GraphQLContext = {
//   prisma: PrismaClient
// }

export function createContext() {
  return { prisma: PrismaClient }
}
