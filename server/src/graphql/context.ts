import { prisma } from '~/lib/prisma'

export type GraphQLContext = {
  prisma: typeof prisma
  user?: { id: string; role: string } | null
}

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

// @ts-ignore
prisma.$on('query', (e: Prisma.QueryEvent) => {
  console.log(`Query: ${e.query}`)
  console.log(`Params: ${e.params}`)
  console.log(`Duration: ${e.duration}ms`)
})

export async function createContext({
  request,
}: {
  request: Request
}): Promise<GraphQLContext> {
  const authHeader = request.headers.get('Authorization')
  let user = null

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    user = await verifyToken(token) // Функция проверки токена
  }

  return { prisma, user }
}

function verifyToken(token: string) {
  // Реализация проверки токена
  return { id: '0', role: 'admin' } // Пример возвращаемого пользователя
}
